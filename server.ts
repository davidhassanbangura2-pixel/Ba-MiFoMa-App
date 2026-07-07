import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// In-memory mock database
const db = {
  users: [] as any[],
  posts: [] as any[],
  messages: [] as any[],
};

// Add initial mock user for testing
db.users.push({
  id: "u1",
  username: "admin",
  email: "admin@bamifoma.app",
  passwordHash: bcrypt.hashSync("password123", 10),
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
  bio: "Admin of Ba MiFoMa",
  createdAt: new Date().toISOString()
});
db.users.push({
  id: "u2",
  username: "testuser",
  email: "test@example.com",
  passwordHash: bcrypt.hashSync("password123", 10),
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=testuser",
  bio: "Just exploring the app!",
  createdAt: new Date().toISOString()
});
db.posts.push({
  id: "p1",
  authorId: "u1",
  content: "Welcome to Ba MiFoMa App! The best social network.",
  createdAt: new Date().toISOString(),
  likes: []
});

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  app.use(cors());
  app.use(express.json());

  // --- API Routes ---

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    const { username, email, password } = req.body;
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: "u" + Date.now(),
      username,
      email,
      passwordHash,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      bio: "New user",
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    const userSafe = { ...newUser };
    delete (userSafe as any).passwordHash;
    const token = jwt.sign({ id: newUser.id, username }, JWT_SECRET);
    res.json({ token, user: userSafe });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const userSafe = { ...user };
    delete (userSafe as any).passwordHash;
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, user: userSafe });
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res: any) => {
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) return res.sendStatus(404);
    const userSafe = { ...user };
    delete (userSafe as any).passwordHash;
    res.json(userSafe);
  });

  // Posts routes
  app.get("/api/posts", (req, res) => {
    // Sort posts newest first, embed author
    const postsWithAuthor = db.posts.map(p => ({
      ...p,
      author: db.users.find(u => u.id === p.authorId)
    })).reverse();
    res.json(postsWithAuthor);
  });

  app.post("/api/posts", authenticateToken, (req: any, res) => {
    const { content, imageUrl } = req.body;
    const newPost = {
      id: "p" + Date.now(),
      authorId: req.user.id,
      content,
      imageUrl,
      createdAt: new Date().toISOString(),
      likes: []
    };
    db.posts.push(newPost);
    res.json(newPost);
  });

  // Users routes
  app.get("/api/users", authenticateToken, (req, res) => {
    const safeUsers = db.users.map(u => {
      const safe = { ...u };
      delete safe.passwordHash;
      return safe;
    });
    res.json(safeUsers);
  });

  // Chat Routes (Messages)
  app.get("/api/messages/:userId", authenticateToken, (req: any, res) => {
    const otherUserId = req.params.userId;
    const myId = req.user.id;
    const chatMessages = db.messages.filter(
      m => (m.senderId === myId && m.receiverId === otherUserId) ||
           (m.senderId === otherUserId && m.receiverId === myId)
    );
    res.json(chatMessages);
  });

  // Socket.io for Real-time chat
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    
    // Simple join room by userId to receive private messages
    socket.on("join", (userId) => {
      socket.join(userId);
    });

    socket.on("sendMessage", (messageData) => {
      const newMsg = {
        id: "m" + Date.now(),
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        content: messageData.content,
        createdAt: new Date().toISOString()
      };
      db.messages.push(newMsg);
      // Send to receiver
      io.to(messageData.receiverId).emit("newMessage", newMsg);
      // Send to sender so their UI updates if they have multiple tabs
      io.to(messageData.senderId).emit("newMessage", newMsg);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // --- Vite Middleware setup ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
