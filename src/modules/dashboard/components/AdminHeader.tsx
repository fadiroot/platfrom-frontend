import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/modules/shared/store";
import { logout } from "@/modules/auth/data/authThunk";
import "./AdminHeader.scss";

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  onToggleCollapse: () => void;
}

const AdminHeader = ({ onToggleSidebar, onToggleCollapse }: AdminHeaderProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="admin-header">
      <div className="admin-header__left">
        <button 
          className="admin-header__menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle mobile menu"
        >
          Menu
        </button>
        <div className="admin-header__brand">
          <h1 className="admin-header__title">Admin Dashboard</h1>
        </div>
        <button 
          className="admin-header__collapse-btn"
          onClick={onToggleCollapse}
          aria-label="Toggle sidebar collapse"
        >
          ←
        </button>
      </div>

      <div className="admin-header__right">
        <button 
          className="admin-header__student-btn"
          onClick={() => navigate("/subjects")}
          title="Go to Student Space"
        >
          👨‍🎓 Student
        </button>
        <div className="admin-header__user">
          <span className="admin-header__username">
            {user?.name || "Admin"}
          </span>
        </div>
        <button 
          className="admin-header__logout-btn" 
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminHeader;