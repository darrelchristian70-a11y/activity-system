const express = require("express");

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1515384597133660303/zskDPHYYGhnKF1rUngtG88IrejZwqaslw06TrQwuxuaksuJzXlQD2AuZhOyCqbL8fc-J";

const REQUIRED_PLAYTIME = 1800; // 30 minutes
const REQUIRED_PD_GAIN = 3;

// PUT ALL GROUP MEMBERS HERE
const GROUP_MEMBERS = [
    { username: "ExamplePlayer1", userId: 123456789 },
    { username: "ExamplePlayer2", userId: 987654321 }
];

let activity = {};

async function sendDiscord(message) {
    await fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            content: message
        })
    });
}

app.get("/", (req, res) => {
    res.send("Activity system online");
});

app.post("/activity", async (req, res) => {
    const { username, userId, playtime, pd } = req.body;
    const id = String(userId);

    if (!activity[id]) {
        activity[id] = {
            username,
            userId,
            playtime: 0,
            pdCountBefore: pd,
            pdCount: pd
        };
    }

    activity[id].username = username;
    activity[id].userId = userId;
    activity[id].playtime = playtime;
    activity[id].pdCount = pd;

    await sendDiscord(
`ACTIVITY RECIEVED
USERNAME: ${username}
USERID: ${userId}
PLAYTIME: ${playtime}
PDCountBefore: ${activity[id].pdCountBefore}
PDCount: ${pd}`
    );

    res.json({
        success: true
    });
});

app.get("/check", async (req, res) => {
    let purgeCount = 0;

    for (const member of GROUP_MEMBERS) {
        const id = String(member.userId);
        const data = activity[id];

        if (!data) {
            purgeCount++;

            await sendDiscord(
`PLAYER NEEDS TO BE PURGED FOR INACTIVTY!
USERNAME: ${member.username}
USERID: ${member.userId}
PLAYTIME: 0
PDCountBefore: UNKNOWN
PDCount: UNKNOWN`
            );

            continue;
        }

        const pdGain = data.pdCount - data.pdCountBefore;

        if (data.playtime < REQUIRED_PLAYTIME || pdGain < REQUIRED_PD_GAIN) {
            purgeCount++;

            await sendDiscord(
`PLAYER NEEDS TO BE PURGED FOR INACTIVTY!
USERNAME: ${data.username}
USERID: ${data.userId}
PLAYTIME: ${data.playtime}
PDCountBefore: ${data.pdCountBefore}
PDCount: ${data.pdCount}`
            );
        }
    }

    if (purgeCount === 0) {
        await sendDiscord("Everyone passed activity.");
    }

    activity = {};

    res.send(`Activity checked. ${purgeCount} player(s) need purge.`);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});
