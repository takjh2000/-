import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { GameList } from "./pages/GameList";
import { MyRentals } from "./pages/MyRentals";
import { AdminGames } from "./pages/AdminGames";
import { AdminUsers } from "./pages/AdminUsers";
import { AdminRentals } from "./pages/AdminRentals";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<GameList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/my-rentals"
          element={
            <ProtectedRoute>
              <MyRentals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/games"
          element={
            <ProtectedRoute adminOnly>
              <AdminGames />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute adminOnly>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rentals"
          element={
            <ProtectedRoute adminOnly>
              <AdminRentals />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
