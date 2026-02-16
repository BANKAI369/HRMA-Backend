import request from "supertest";
import app from "../app";

describe("User API", () => {
    it("Should return 401 if no token provided", async () =>{
        const res = await request(app).get("/api/users");

        expect(res.status).toBe(401);
    });

    it("Should return users for valid admin token", async () => {
        const res = await request(app)
        .get("/api/users")
        .set("Authorization", "Bearer admin-token");

    expect(res.status).toBe(200);
    });
});