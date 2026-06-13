const express = require("express");

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1515384597133660303/zskDPHYYGhnKF1rUngtG88IrejZwqaslw06TrQwuxuaksuJzXlQD2AuZhOyCqbL8fc-J";
const GROUP_ID = "15038532";

const REQUIRED_PLAYTIME = 1800;
const REQUIRED_PD_GAIN = 3;

let activity = {};

async function sendDiscord(message) {
    return fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message.slice(0, 1900) })
    });
}

async function getGroupMembers() {
    let members = [];
    let cursor = "";

    do {
        const url = `https://groups.roblox.com/v1/groups/${GROUP_ID}/users?limit=100${cursor ? `&cursor=${cursor}` : ""}`;
        const response = await fetch(url);

        if (!response.ok) {
            const text = await response.text();
            console.log("Roblox group API error:", response.status, text);
            throw new Error("Failed to fetch group members");
        }

        const json = await response.json();

        for (const item of json.data || []) {
            members.push({
                userId: String(item.user.userId),
                username: item.user.username
            });
        }

        cursor = json.nextPageCursor || "";
    } while (cursor);

    return members;
}

app.get("/", (req, res) => {
    res.status(200).send("Activity system online");
});

app.post("/activity", async (req, res) => {
    const { username, userId, playtime, pd } = req.body;
    const id = String(userId);

    if (!activity[id]) {
        activity[id] = {
            username,
            userId: id,
            playtime: 0,
            pdCountBefore: Number(pd) || 0,
            pdCount: Number(pd) || 0
        };
    }

    activity[id].username = username;
    activity[id].playtime = Number(playtime) || 0;
    activity[id].pdCount = Number(pd) || 0;

    await sendDiscord(
`ACTIVITY RECIEVED
USERNAME: ${username}
USERID: ${id}
PLAYTIME: ${activity[id].playtime}
PDCountBefore: ${activity[id].pdCountBefore}
PDCount: ${activity[id].pdCount}`
    );

    res.json({ success: true });
});

app.get("/check", async (req, res) => {
    res.send("Check started. Watch Discord.");

    const members = await getGroupMembers();
    const failed = [];

    for (const member of members) {
        const data = activity[String(member.userId)];

        if (!data) {
            failed.push(`USERNAME: ${member.username}\nUSERID: ${member.userId}\nPLAYTIME: 0\nPDCountBefore: UNKNOWN\nPDCount: UNKNOWN`);
            continue;
        }

        const pdGain = data.pdCount - data.pdCountBefore;

        if (data.playtime < REQUIRED_PLAYTIME || pdGain < REQUIRED_PD_GAIN) {
            failed.push(`USERNAME: ${data.username}\nUSERID: ${data.userId}\nPLAYTIME: ${data.playtime}\nPDCountBefore: ${data.pdCountBefore}\nPDCount: ${data.pdCount}`);
        }
    }

    if (failed.length === 0) {
        await sendDiscord("Everyone passed activity.");
    } else {
        for (const chunk of failed) {
            await sendDiscord(`PLAYER NEEDS TO BE PURGED FOR INACTIVTY!\n${chunk}`);
        }
    }

    activity = {};
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});
