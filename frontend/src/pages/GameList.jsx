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
      <table>
        <thead>
          <tr>
            <th>게임 이름</th>
            <th>카테고리</th>
            <th>소유자</th>
            <th>전체 수량</th>
            <th>남은 재고</th>
            <th>비고</th>
            {user && <th></th>}
          </tr>
        </thead>
        <tbody>
          {games.map((g) => (
            <tr key={g.id} className={g.remaining_quantity <= 0 ? "out-of-stock" : ""}>
              <td>{g.name}</td>
              <td>{g.category === "boardgame" ? "보드게임" : "크라임씬"}</td>
              <td>{g.owner}</td>
              <td>{g.total_quantity}</td>
              <td>{g.remaining_quantity}</td>
              <td>{g.notes}</td>
              {user && (
                <td>
                  <button disabled={g.remaining_quantity <= 0} onClick={() => handleRent(g.id)}>
                    대여
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
