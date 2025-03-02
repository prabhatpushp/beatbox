import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";

const App = () => (
    <BrowserRouter>
        <div className="min-h-screen pb-20">
            <Routes>
                <Route path="/" element={<Index />} />
            </Routes>
        </div>
    </BrowserRouter>
);

export default App;
