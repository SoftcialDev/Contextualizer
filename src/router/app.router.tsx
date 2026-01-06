import { createBrowserRouter, Navigate } from "react-router";
import Preconfig from "../user/pages/Preconfig";
import Config from "../user/pages/Config";

export const router = createBrowserRouter([
    {
        path: '/',
        children: [
            {
                index: true,
                element: <Navigate to='preconfig' replace />
            },
            {
                path: 'preconfig',
                element: <Preconfig />
            },
            {
                path: 'config',
                element: <Config />
            }
        ]
    }
])