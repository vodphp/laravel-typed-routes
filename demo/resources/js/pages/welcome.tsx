import { routes } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';




export default function Welcome(props: {errors: {
    form?: string;
}}) {
    const goToDashboard = () => {
        //Must be an inertia route to "visit"
        routes.dashboard.get().visit();
    } 
    const manuallyCall = async () => {
        //Must not be an inertia route to use "call"
        const response = await routes.example.manuallyTyped.get().call({
            message: 'Hello, world!',
        });    
        alert(response.message);    
    }

    //Must not be an inertia route to use "useQuery" or "useMutation"
    const { data: manuallyTypedData, isLoading, error } = routes.example.manuallyTyped.get().useQuery({
        message: 'Hello, world!',
    });
    //Must be an inertia response or redirect route to use "useForm"
    const {submit, data, setData} = routes.example.form.post().useForm({
        'email': 'test@test.tco',
        'message': 'name',
        'name': null,
    });

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className='flex flex-col gap-4 content-center justify-center h-screen'>
                <div className='flex flex-col gap-4 max-w-md w-full mx-auto'>
                    <Button onClick={() => manuallyCall()}>Manually Call (fetch)</Button>
                    <Button onClick={() => goToDashboard()}>Go To Dashboard (inertia visit)</Button>
                    <h2>From useQuery:</h2>
                    {isLoading ? 'loading...' : ''} {manuallyTypedData?.message} {manuallyTypedData?.statusCode}
                    <br />
                    <h2>From useForm:</h2>
                    Example of a form:
                    {
                        Object.entries(data).map(([key, value]) => {
                            return <div key={key}>{key}
                            <Input value={value ?? ''} onChange={(e) => setData(key as keyof typeof data, e.target.value)} />
                            </div>
                        })
                    }{
                        //Inertia errors aren't automatically typed currently.
                        props.errors.form
                    }
                    <Button onClick={() => submit()}>Submit</Button>
            </div>
            </div>
        </>
    );
}
