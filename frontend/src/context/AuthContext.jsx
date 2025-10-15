import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(() => {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    });

    const updateUser = (data) => {
        setCurrentUser(data);
    };

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem("user", JSON.stringify(currentUser));
        } else {
            localStorage.removeItem("user"); // Clear localStorage if user is null
        }
    }, [currentUser]);

    return (
        <AuthContext.Provider value={{ currentUser, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
