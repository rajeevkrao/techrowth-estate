import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export const register = async (req,res) => {

    // Hash the Password
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new User in the database
        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            }
        })

        res.status(201).json({ message: "User registered successfully!"});

    } catch (error) {
        if (error.code === 'P2002' && error.meta?.target === 'User_email_key') {
            return res.status(400).json({ error: "User with this email already exists." });
        }

        console.log({error})

        res.status(500).json({ error: "Server error while registering user." });
    }
}

export const login = async (req,res) => {
    const { username, password} = req.body;

    try {
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: {
                username
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        // Generate and send JWT
        // const token = generateToken(user.id);
        // res.json({ message: "User logged in successfully!", token });

        const age = 1000 * 60 * 60 * 24 * 7;

        const token = jwt.sign({
            id: user.id,
            isAdmin: false,
        }, process.env.JWT_SECRET_KEY,
            { expiresIn: age }
        );

        const {password: userPassword, ...userInfo} = user;

        res.cookie("token", token, {
            httpOnly: true,
            // secure: true,
            maxAge: age
        })
        .status(200).json(userInfo);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error while logging in user." });
    }
}

export const logout = (req,res) => {
    res.clearCookie("token")
       .status(200).json({ message: "User logged out successfully!" });
}