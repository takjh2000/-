import { useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export function GameList() {
  const [games, setGames] = useState([]);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  async function fetchGames() {
    const params = {};
    if (category) params.category = category;
    if (search) params.search = search;
    const res = await client.get("/games", { params });
    setGames(res.data);
  }

  useEffect(() => {
    const timer = setTimeout(fetchGames, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search]);

  async function handleRent(gameId) {
    setMessage("");
    try {
      await client.post("/rentals", { game_id: gameId });
      setMessage("대여가 완료되었습니다.");
      fetchGames();
    } catch (err) {
      setMessage(err.response?.data?.detail || "대여에 실패했습니다.");
    }
  }

  return (
    <div>
      <h2>게임 목록</h2>
      <div className="toolbar">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">전체 카테고리</option>
          <option value="boardgame">보드게임</option>
          <option value="crimescene">크라임씬</option>
        </select>
        <input
          placeholder="게임 이름 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {message && <p className="info">{message}</p>}
      <div className="game-grid">
        {games.map((g) => (
          <div
            key={g.id}
            className={`game-card ${g.remaining_quantity <= 0 ? "out-of-stock" : ""}`}
          >
            <div className="game-card-header">
              <span className="game-card-name">{g.name}</span>
              <span className={`badge ${g.category === "boardgame" ? "badge-boardgame" : "badge-crimescene"}`}>
                {g.category === "boardgame" ? "보드게임" : "크라임씬"}
              </span>
            </div>
            <div className="game-card-meta">
              <span>소유자: {g.owner || "-"}</span>
              <span className="game-card-stock">
                재고: <strong>{g.remaining_quantity}</strong> / {g.total_quantity}
              </span>
            </div>
            {g.notes && <div className="game-card-notes">{g.notes}</div>}
            {user && (
              <button disabled={g.remaining_quantity <= 0} onClick={() => handleRent(g.id)}>
                {g.remaining_quantity <= 0 ? "대여 불가" : "대여하기"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
