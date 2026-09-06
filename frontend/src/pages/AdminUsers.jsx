import { useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const { user: currentUser } = useAuth();

  async function fetchUsers() {
    const res = await client.get("/users");
    setUsers(res.data);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleRoleChange(id, role) {
    setMessage("");
    try {
      await client.patch(`/users/${id}/role`, { role });
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.detail || "권한 변경에 실패했습니다.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("정말 이 회원을 삭제하시겠습니까?")) return;
    try {
      await client.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.detail || "삭제에 실패했습니다.");
    }
  }

  return (
    <div>
      <h2>회원 관리</h2>
      {message && <p className="error">{message}</p>}
      <table>
        <thead>
          <tr>
            <th>이름</th>
            <th>아이디</th>
            <th>권한</th>
            <th>가입일</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.username}</td>
              <td>
                <select
                  value={u.role}
                  disabled={u.id === currentUser.id}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                >
                  <option value="member">일반 부원</option>
                  <option value="admin">임원</option>
                </select>
              </td>
              <td>{u.created_at?.slice(0, 10)}</td>
              <td>
                {u.id !== currentUser.id && (
                  <button onClick={() => handleDelete(u.id)}>삭제</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
