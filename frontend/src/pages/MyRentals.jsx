import { useEffect, useState } from "react";
import client from "../api/client";

export function MyRentals() {
  const [rentals, setRentals] = useState([]);
  const [message, setMessage] = useState("");

  async function fetchRentals() {
    const res = await client.get("/rentals/me");
    setRentals(res.data);
  }

  useEffect(() => {
    fetchRentals();
  }, []);

  async function handleReturn(id) {
    setMessage("");
    try {
      await client.post(`/rentals/${id}/return`);
      fetchRentals();
    } catch (err) {
      setMessage(err.response?.data?.detail || "반납에 실패했습니다.");
    }
  }

  return (
    <div>
      <h2>내 대여 현황</h2>
      {message && <p className="error">{message}</p>}
      <table className="stack-on-mobile">
        <thead>
          <tr>
            <th>게임 이름</th>
            <th>대여일</th>
            <th>반납 예정일</th>
            <th>반납일</th>
            <th>상태</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rentals.map((r) => (
            <tr key={r.id} className={r.is_overdue ? "overdue" : ""}>
              <td data-label="게임 이름">{r.game_name}</td>
              <td data-label="대여일">{r.rental_date}</td>
              <td data-label="반납 예정일">{r.due_date}</td>
              <td data-label="반납일">{r.return_date || "-"}</td>
              <td data-label="상태">
                {r.status === "rented" ? (
                  r.is_overdue ? (
                    <span className="badge badge-overdue">연체중</span>
                  ) : (
                    <span className="badge badge-rented">대여중</span>
                  )
                ) : (
                  <span className="badge badge-returned">반납완료</span>
                )}
              </td>
              <td data-label="관리">
                {r.status === "rented" && (
                  <button onClick={() => handleReturn(r.id)}>반납</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
