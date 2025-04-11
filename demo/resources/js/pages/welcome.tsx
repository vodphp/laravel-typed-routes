import { routes } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';




export default function Welcome() {


    const goToDashboard = () => {
        //Must be an inertia route to "visit"
        routes.dashboard.get().visit();
    }

    const manuallyCall = async () => {
        //Must not be an inertia route to use "call"
        const response = await routes.example.manuallyTyped.get().call({
            message: 'Hello, world!',
        });        
    }

    //Must not be an inertia route to use "useQuery" or "useMutation"
    const { data: manuallyTypedData, isLoading, error } = routes.example.manuallyTyped.get().useQuery({
        message: 'Hello, world!',
    });
    console.log(manuallyTypedData);
    //Must be an inertia route to use "useForm"
    const {submit, data, setData} = routes.example.dto.post().useForm({
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
            <div>
                    <Button onClick={() => manuallyCall()}>Manually Call</Button>
                    <Button onClick={() => goToDashboard()}>Go To Dashboard</Button>

                    From useQuery: {manuallyTypedData?.message} {manuallyTypedData?.statusCode} 
                    <br />
                    Example of a form:
                    {
                        Object.entries(data).map(([key, value]) => {
                            return <div key={key}>{key}
                            <Input value={value ?? ''} onChange={(e) => setData(key as keyof typeof data, e.target.value)} />
                            </div>
                        })
                    }
                    <Button onClick={() => submit()}>Submit</Button>
            </div>
        </>
    );
}
