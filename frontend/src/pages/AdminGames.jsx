import { useEffect, useState } from "react";
import client from "../api/client";

const emptyForm = { name: "", category: "boardgame", owner: "", total_quantity: 1, notes: "" };

export function AdminGames() {
  const [games, setGames] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  async function fetchGames() {
    const params = {};
    if (search) params.search = search;
    const res = await client.get("/games", { params });
    setGames(res.data);
  }

  useEffect(() => {
    const timer = setTimeout(fetchGames, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleCreate(e) {
    e.preventDefault();
    setMessage("");
    try {
      await client.post("/games", { ...form, total_quantity: Number(form.total_quantity) });
      setForm(emptyForm);
      fetchGames();
    } catch (err) {
      setMessage(err.response?.data?.detail || "등록에 실패했습니다.");
    }
  }

  async function handleUpdate(game, field, value) {
    try {
      await client.patch(`/games/${game.id}`, { [field]: value });
      fetchGames();
    } catch (err) {
      setMessage(err.response?.data?.detail || "수정에 실패했습니다.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await client.delete(`/games/${id}`);
      fetchGames();
    } catch (err) {
      setMessage(err.response?.data?.detail || "삭제에 실패했습니다.");
    }
  }

  return (
    <div>
      <h2>게임 관리</h2>
      <form className="inline-form" onSubmit={handleCreate}>
        <input
          placeholder="게임 이름"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="boardgame">보드게임</option>
          <option value="crimescene">크라임씬</option>
        </select>
        <input
          placeholder="소유자"
          value={form.owner}
          onChange={(e) => setForm({ ...form, owner: e.target.value })}
        />
        <input
          type="number"
          min="1"
          placeholder="전체 수량"
          value={form.total_quantity}
          onChange={(e) => setForm({ ...form, total_quantity: e.target.value })}
        />
        <input
          placeholder="비고"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <button type="submit">게임 등록</button>
      </form>

      <input
        className="search-box"
        placeholder="게임 이름 검색"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {message && <p className="error">{message}</p>}

      <table>
        <thead>
          <tr>
            <th>게임 이름</th>
            <th>카테고리</th>
            <th>소유자</th>
            <th>전체 수량</th>
            <th>대여중</th>
            <th>남은 재고</th>
            <th>비고</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => (
            <tr key={g.id}>
              <td>{g.name}</td>
              <td>
                <span className={`badge ${g.category === "boardgame" ? "badge-boardgame" : "badge-crimescene"}`}>
                  {g.category === "boardgame" ? "보드게임" : "크라임씬"}
                </span>
              </td>
              <td>
                <input
                  defaultValue={g.owner || ""}
                  onBlur={(e) => handleUpdate(g, "owner", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  defaultValue={g.total_quantity}
                  onBlur={(e) => handleUpdate(g, "total_quantity", Number(e.target.value))}
                />
              </td>
              <td>{g.rented_quantity}</td>
              <td>{g.remaining_quantity}</td>
              <td>
                <input
                  defaultValue={g.notes || ""}
                  onBlur={(e) => handleUpdate(g, "notes", e.target.value)}
                />
              </td>
              <td>
                <button onClick={() => handleDelete(g.id)}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
