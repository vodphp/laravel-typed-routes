<?php

namespace Vod\LaravelTypedRoutes\Commands;


use Exception;
use Illuminate\Console\Command;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Routing\Route as RoutingRoute;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use ReflectionClass;
use ReflectionIntersectionType;
use ReflectionMethod;
use ReflectionNamedType;
use ReflectionType;
use ReflectionUnionType;
use Vod\LaravelTypedRoutes\Attributes\TypescriptRequestProps;
use Vod\LaravelTypedRoutes\Attributes\TypescriptResponseProps;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Formatters\PrettierFormatter;
use Spatie\TypeScriptTransformer\Transformers\TransformsTypes;
use Spatie\TypeScriptTransformer\TypeReflectors\ClassTypeReflector;
use Spatie\TypeScriptTransformer\TypeScriptTransformerConfig;
use Throwable;

class TypescriptTransformRoutes extends Command
{
    use TransformsTypes;

    protected $signature = 'typescript:transform-routes';

    protected $description = 'Generates type definitions for Laravel named routes';

    protected const ERROR_RESPONSE_TYPE = 'GenericRouteError';

    protected null|TypeScriptTransformerConfig $config = null;


    public function handle(
        TypeScriptTransformerConfig $config,
    ): int {
        $this->config = $config;
        $routes = Route::getRoutes()->getRoutes();

        $schema = [];
        foreach ($routes as $route) {
            if (! is_string($route->uri)) {
                $this->line("Only string routes are supported");
                continue;
            }

   

            $parts = Str::replace('/', '.', $route->uri);

            foreach ($route->methods() as $method) {
                if ($method === 'HEAD') {
                    continue;
                }
                Arr::set($schema, $parts.'.'.Str::lower($method), $route);
            }
        }
        $errorResponseType = self::ERROR_RESPONSE_TYPE;
        $definition = <<<EOF
        interface $errorResponseType extends Error {
            response: unknown;
            body: unknown;
            status: number;
        }

        export interface RouteMethods<RequestType, ResponseType> {
            method: 'get'|'post'|'put'|'delete';
            request: RequestType;
            response: ResponseType;
            href: string;
        }
        
        export interface Routes
        EOF;

        $definition .= $this->buildChildRoutes($schema);
        $routesPath = config('typed-routes.output_path');

        $paths = [$routesPath];

        foreach ($paths as $path) {
            @file_put_contents($path, $definition);
            app(PrettierFormatter::class)->format($path);
        }

        return Command::SUCCESS;
    }

    private function hyphenToCamelWithTrailingHyphen(string $string): string
    {
        $trailingChar = Str::endsWith($string, '-') ? '-' : '';

        return Str::camel($string).$trailingChar;
    }

    /**
     * @param array<string, mixed>|RoutingRoute $routes
     */
    private function buildChildRoutes(array|RoutingRoute $routes, ?string $key = null): string
    {
        if (is_array($routes)) {
            $part = '{';
            foreach ($routes as $key => $route) {
                $part .= PHP_EOL;
                if (Str::startsWith($key, '{')) {
                    $onlyURLSafeCharacters = preg_replace('/[^a-zA-Z0-9_]/', '', $key);
                    $part .= "$onlyURLSafeCharacters: (param: string|number) =>  ";
                } else {
                    $camelKey = $this->hyphenToCamelWithTrailingHyphen($key);
                    $part .= "'$camelKey': ";
                }
                try {
                    $part .= $this->buildChildRoutes($route, $key);
                } catch (Throwable $error) {
                    $this->warn('Error building child routes for '.$key);
                    $part .= 'any;';
                }
            }
            $part .= '}';
            $part .= PHP_EOL;

            return $part;
        } else {
            $route = $routes;
            
            $requestType = $this->requestType($route);
            $responseType = $this->responseType($route);
          
            $part = "() => RouteMethods<$requestType,$responseType>;";
            return $part;
        }
    }

    private function requestType(RoutingRoute $route): string
    {
        try {
            $controller = $this->routeController($route);
            $method = $this->routeMethod($route);
            $actionReflection = new ReflectionMethod($controller, $method);

            $explicitRequestType = $this->explicitRequestType($actionReflection);
            if ($explicitRequestType) {
                return $explicitRequestType;
            }

            try {
                $rules = $this->rulesForAction($actionReflection);
                if (is_string($rules)) {
                    return $rules;
                }
            } catch (Throwable $error) {
                $this->warn('Error getting rules for '.$controller.'@'.$method);
                return 'any';
            }

            if (is_array($rules)) {
                return $this->validationRulesToTypescriptTypes($rules);
            }
        } catch (Throwable $error) {
            $message = json_encode(['route' => $route->uri(), 'message' => $error->getMessage()]);
            $this->warn($message ? $message : 'Unknown error');
            throw $error;
        }

        return 'any';
    }

    /**
     * @return string|array<string, string|array<int, string>>|null
     */
    private function rulesForAction(ReflectionMethod $actionReflection): array|string|null
    {
        $parameters = $actionReflection->getParameters();
        $rules = [];
        foreach ($parameters as $parameter) {
            $parameterType = $parameter->getType();
            if ($parameterType instanceof ReflectionNamedType) {
                $parameterClass = $parameterType->getName();

                if (is_subclass_of($parameterClass, FormRequest::class)) {
                    $explicitRequestType = $this->explicitRequestType(new ReflectionClass($parameterClass));
                    if ($explicitRequestType) {
                        return $explicitRequestType;
                    }

                    $classRules = method_exists($parameterClass, 'rules')
                        ? app()->call([new $parameterClass, 'rules'])
                        : [];
                    $rules = array_merge($rules, $classRules);
                }

                if (is_subclass_of($parameterClass, '\Spatie\LaravelData\Data', true)) {
                    $typescriptType = $this->phpTypeToTypescriptType($parameterClass);
                    if ($typescriptType && $typescriptType !== 'any') {
                        return $typescriptType;
                    }   

                    $dataValidatorResolver = app('Spatie\LaravelData\Resolvers\DataValidatorResolver');
                    $validator = $dataValidatorResolver->execute($parameterClass, []);
                    $rules = array_merge($validator->getRules());
                }
            }
        }

        if ($rules) {
            return $rules;
        }

        return null;
    }

    /**
     * @param array<string, string|array<int, string>> $rules
     */
    private function validationRulesToTypescriptTypes(array $rules): string
    {
        $type = '{';
        foreach ($rules as $field => $rule) {
            if (Str::contains($field, '.')) {
                continue;
            }
            $type .= PHP_EOL;
            $type .= "'$field': ";

            $subRules = is_string($rule) ? explode('|', $rule) : $rule;
            if (! is_array($subRules)) {
                $type .= 'any;';
                continue;
            }
            $stringTypes = ['string', 'email', 'url'];
            $isRequired = in_array('required', $subRules);
            $isString = collect($subRules)
                ->filter(fn ($rule) => is_string($rule))
                ->intersect($stringTypes)
                ->isNotEmpty();
            $isNumeric = in_array('numeric', $subRules);
            $isBoolean = in_array('boolean', $subRules);
            $isArray = in_array('array', $subRules);
            if ($isString) {
                $type .= 'string';
            } elseif ($isNumeric) {
                $type .= 'number';
            } elseif ($isBoolean) {
                $type .= 'boolean';
            } elseif ($isArray) {
                $type .= 'any[]';
            } else {
                $type .= 'any';
            }
            if (! $isRequired) {
                $type .= '|null';
            }
            $type .= ';';
        }
        $type .= PHP_EOL;
        $type .= '[key: string]: any;';
        $type .= '}';

        return $type;
    }

    private function responseType(RoutingRoute $route): string
    {
        try {
            $controller = $this->routeController($route);
            $method = $this->routeMethod($route);
            $actionReflection = new ReflectionMethod($controller, $method);

            $explicitResponseType = $this->explicitResponseType($actionReflection);
            if ($explicitResponseType) {
                return $explicitResponseType;
            }

            $returnType = $actionReflection->getReturnType();
            if (! $returnType) {
                return throw new Exception('No return type defined for '.$controller.'@'.$method);
            }      
            $typescriptType = $this->reflectionTypeToTypescriptType($returnType);
            if ($typescriptType) {
                return $typescriptType;
            }
        } catch (Throwable $error) {
            $this->warn($error->getMessage());
        }

        return 'any';
    }

    // TODO improve support for container types
    private function reflectionTypeToTypescriptType(ReflectionType $type): string
    {
        if ($type instanceof ReflectionNamedType) {
            return $this->phpTypeToTypescriptType($type->getName());
        }

        if ($type instanceof ReflectionUnionType) {
            return $this->joinUnionOrIntersectionTypes($type, '|');
        }

        if ($type instanceof ReflectionIntersectionType) {
            return $this->joinUnionOrIntersectionTypes($type, '&');
        }

        throw new Exception('Unknown type: '.$type::class);
    }

    private function joinUnionOrIntersectionTypes(
        ReflectionUnionType|ReflectionIntersectionType $type,
        string $joiner
    ): string {
        return collect($type->getTypes())
            ->map(function (ReflectionNamedType|ReflectionUnionType|ReflectionType $subType) {
                return $this->reflectionTypeToTypescriptType($subType);
            })->implode($joiner);
    }

    private function phpTypeToTypescriptType(mixed $phpType): string
    {
        switch ($phpType) {
            case 'int':
            case 'float':
            case 'double':
            case 'number':
                return 'number';
            case 'string':
                return 'string';
            case 'bool':
            case 'boolean':
                return 'boolean';
            case 'array':
                return 'any[]';
            case 'object':
                return 'any';
            case 'mixed':
                return 'any';
            case 'void':
                return 'void';
            case 'null':
                return 'null';
        }
        if (class_exists($phpType)) {
            $reflection = new ReflectionClass($phpType);
            $type = new ClassTypeReflector($reflection);
            if ($type->isTransformable()) {
                $name = $reflection->name;
                if ($customTypeName = $reflection->getAttributes(TypeScript::class)) {
                    if ($customTypeName[0]->getArguments()) {
                        $customName = $customTypeName[0]->getArguments()[0];
                        $name = $reflection->getNamespaceName().'\\'.$customName;
                    }
                }

                return Str::replace('\\', '.', $name);
            }
        }

        return 'any';
    }

    /**
     * @template T of object
     *
     * @param ReflectionMethod|ReflectionClass<T> $reflection
     *
     * @return string|null
     */
    private function explicitResponseType(ReflectionMethod|ReflectionClass $reflection): string|null
    {
        return $this->explicitAttributeType($reflection, TypescriptResponseProps::class);
    }

    /**
     * @template T of object
     *
     * @param ReflectionMethod|ReflectionClass<T> $reflection
     *
     * @return string|null
     */
    private function explicitRequestType(ReflectionMethod|ReflectionClass $reflection): string|null
    {
        return $this->explicitAttributeType($reflection, TypescriptRequestProps::class);
    }

    /**
     * @template T of object
     *
     * @param ReflectionMethod|ReflectionClass<T> $reflection
     *
     * @return string|null
     */
    private function explicitAttributeType(
        ReflectionMethod|ReflectionClass $reflection,
        string $attributeType
    ): string|null {
        $attributes = $reflection->getAttributes($attributeType);
        if (! $attributes) {
            return null;
        }

        return $attributes[0]->getArguments()[0];
    }

    private function routeController(RoutingRoute $route): string
    {
        $controller = $this->routeActionParts($route)[0] ?? null;
        if (! $controller) {
            throw new Exception('No controller defined for '.$route->uri());
        }

        return $controller;
    }

    private function routeMethod(RoutingRoute $route): string
    {
        $method = $this->routeActionParts($route)[1] ?? null;
        if (! $method) {
            throw new Exception('No method defined for '.$route->uri());
        }

        return $method;
    }

    /**
     * @return array<int, string>
     */
    private function routeActionParts(RoutingRoute $route): array
    {
        $action = $route->getAction();
        $actionString = $action['uses'] ?? $action['controller'] ?? '';

        if ($actionString && is_string($actionString)) {
            return explode('@', $actionString);
        }

        return [];
    }

}
