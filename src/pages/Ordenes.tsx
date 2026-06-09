import { Routes, Route } from "react-router-dom";
import OrdenesList from "./OrdenesList";
import OrdenDetail from "./OrdenDetail";
import OrdenNueva from "./OrdenNueva";

export default function Ordenes() {
  return (
    <Routes>
      <Route index element={<OrdenesList />} />
      <Route path="nueva" element={<OrdenNueva />} />
      <Route path=":id" element={<OrdenDetail />} />
    </Routes>
  );
}
