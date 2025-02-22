import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user } = useContext(AuthContext);

    console.log("User data in ProtectedRoute:", user);

    if (!user || !user.role || user.role !== 'ROLE_ADMIN') {
        return <Navigate to="/login" />;
    }

    return children;
};

export default ProtectedRoute;
