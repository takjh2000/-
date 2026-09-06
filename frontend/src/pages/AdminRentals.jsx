import { useEffect, useState } from "react";
import client from "../api/client";

export function AdminRentals() {
  const [rentals, setRentals] = useState([]);
  const [stats, setStats] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage] = useState("");

  async function fetchRentals() {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    const res = await client.get("/rentals", { params });
    setRentals(res.data);
  }

  async function fetchStats() {
    const res = await client.get("/rentals/overdue-stats");
    setStats(res.data);
  }

  useEffect(() => {
    fetchRentals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  async function handleReturn(id) {
    setMessage("");
    try {
      await client.post(`/rentals/${id}/return`);
      fetchRentals();
      fetchStats();
    } catch (err) {
      setMessage(err.response?.data?.detail || "반납 처리에 실패했습니다.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("이 대여 기록을 삭제하시겠습니까?")) return;
    try {
      await client.delete(`/rentals/${id}`);
      fetchRentals();
    } catch (err) {
      setMessage(err.response?.data?.detail || "삭제에 실패했습니다.");
    }
  }

  return (
    <div>
      <h2>전체 대여 기록</h2>
      <div className="toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">전체</option>
          <option value="rented">대여중</option>
          <option value="returned">반납완료</option>
        </select>
      </div>
      {message && <p className="error">{message}</p>}
      <table>
        <thead>
          <tr>
            <th>게임</th>
            <th>대여자</th>
            <th>대여일</th>
            <th>반납예정일</th>
            <th>반납일</th>
            <th>상태</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rentals.map((r) => (
            <tr key={r.id} className={r.is_overdue ? "overdue" : ""}>
              <td>{r.game_name}</td>
              <td>{r.borrower_name}</td>
              <td>{r.rental_date}</td>
              <td>{r.due_date}</td>
              <td>{r.return_date || "-"}</td>
              <td>
                {r.status === "rented" ? (r.is_overdue ? "🚨연체중🚨" : "대여중") : "반납완료"}
              </td>
              <td>
                {r.status === "rented" && <button onClick={() => handleReturn(r.id)}>반납처리</button>}
                <button onClick={() => handleDelete(r.id)}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>연체 누적 통계</h2>
      <table>
        <thead>
          <tr>
            <th>이름</th>
            <th>누적 연체 일수</th>
            <th>누적 연체 횟수</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.user_id}>
              <td>{s.name}</td>
              <td>{s.total_overdue_days}일</td>
              <td>{s.overdue_count}회</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
