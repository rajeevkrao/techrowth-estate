import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    const token = req.cookies.token;

    if(!token) return res.status(401).json({ message: "Not Authenticated" });

    jwt.verify(token, process.env.JWT_SECRET_KEY, async(err, payload) => {
        if(err) return res.status(403).json({ message: "Token is invalid" });
        req.userId = payload.id;
        req.userRole = payload.role;
        req.isAdmin = payload.isAdmin;
        next();
    });
}

export const verifyAdmin = (req, res, next) => {
    const token = req.cookies.token;

    if(!token) return res.status(401).json({ message: "Not Authenticated" });

    jwt.verify(token, process.env.JWT_SECRET_KEY, async(err, payload) => {
        if(err) return res.status(403).json({ message: "Token is invalid" });

        if(payload.role !== 'ADMIN') {
            return res.status(403).json({ message: "Access denied. Admin only." });
        }

        req.userId = payload.id;
        req.userRole = payload.role;
        req.isAdmin = true;
        next();
    });
}

export default verifyToken;