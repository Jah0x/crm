// src/app/App.tsx
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Providers } from "./providers/Providers";
import { AppRouter } from "./AppRouter";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Providers>
          <AppRouter />
        </Providers>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
