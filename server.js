import express from "express";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

app.use(
    cors({
        origin: "https://video-call-app-nine.vercel.app",
        methods: ["GET", "POST"],
    })
);

const server = app.listen(process.env.PORT || 8000, () => {
    console.log(
        `server started on: http://localhost:${process.env.PORT | 8000}`
    );
});

const io = new Server(server, {
    cors: {
        origin: "https://video-call-app-nine.vercel.app",
    },
});

io.on("connection", (socket) => {
    socket.on("create-room", async (roomId) => {
        // fetching all the number of socket that are join
        const roomStat = await io.to(roomId).fetchSockets();
        if (roomStat.length === 0) {
            socket.join(roomId);
            socket.emit("room:created", { roomId });
        } else if (roomStat.length === 1) {
            socket.join(roomId);
            socket.emit("room:joined", { roomId });
        } else {
            socket.emit("room-full", { roomId });
        }
    });

    socket.on("remote:ready", ({ roomId }) => {
        socket.broadcast.to(roomId).emit("remote:ready", { roomId });
    });

    socket.on("SDP:offer", ({ offer, roomId }) => {
        socket.broadcast.to(roomId).emit("SDP:offer", { offer, roomId });
    });

    socket.on("SPD:answer", ({ answer, roomId }) => {
        // sending the ans to local
        socket.broadcast.to(roomId).emit("SPD:answer", { answer, roomId });
    });

    socket.on("ICECandidate:local", ({ type, candidate, roomID }) => {
        socket.broadcast
            .to(roomID)
            .emit("ICECandidate:local", { type, candidate, roomID });
    });

    socket.on("ICECandidate:remote", ({ type, candidate, roomID }) => {
        socket.broadcast
            .to(roomID)
            .emit("ICECandidate:remote", { type, candidate, roomID });
    });

    socket.on("client:disconect", ({ roomID }) => {
        socket.broadcast.to(roomID).emit("client:disconect", { roomID });
    });

    socket.on("disconnect", () => {
        socket.broadcast.emit("close", { id: socket.id });
    });
});
