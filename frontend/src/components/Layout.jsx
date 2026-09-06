import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div>
      <header className="navbar">
        <div className="navbar-brand">🎲 보드게임 대여 시스템</div>
        <nav>
          <Link to="/">게임 목록</Link>
          {user && <Link to="/my-rentals">내 대여 현황</Link>}
          {isAdmin && <Link to="/admin/games">게임 관리</Link>}
          {isAdmin && <Link to="/admin/rentals">대여 관리</Link>}
          {isAdmin && <Link to="/admin/users">회원 관리</Link>}
        </nav>
        <div className="navbar-user">
          {user ? (
            <>
              <span>
                {user.name}
                {isAdmin ? " (임원)" : " (부원)"}
              </span>
              <button onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/login">로그인</Link>
              <Link to="/register">회원가입</Link>
            </>
          )}
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
