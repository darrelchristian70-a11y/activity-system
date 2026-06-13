const express = require("express");

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1515384597133660303/zskDPHYYGhnKF1rUngtG88IrejZwqaslw06TrQwuxuaksuJzXlQD2AuZhOyCqbL8fc-J";

const REQUIRED_PLAYTIME = 1800; // 30 minutes
const REQUIRED_PD_GAIN = 3;

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

```
if (!activity[userId]) {
    activity[userId] = {
        username,
        userId,
        playtime: 0,
        pdCountBefore: pd,
        pdCount: pd
    };
}

activity[userId].username = username;
activity[userId].playtime = playtime;
activity[userId].pdCount = pd;

await sendDiscord(
```

`ACTIVITY RECIEVED
USERNAME: ${username}
USERID: ${userId}
PLAYTIME: ${playtime}
PDCountBefore: ${activity[userId].pdCountBefore}
PDCount: ${pd}`
);

```
res.json({
    success: true
});
```

});

app.get("/check", async (req, res) => {
for (const userId in activity) {
const data = activity[userId];

```
    const pdGain = data.pdCount - data.pdCountBefore;

    if (
        data.playtime < REQUIRED_PLAYTIME ||
        pdGain < REQUIRED_PD_GAIN
    ) {
        await sendDiscord(
```

`PLAYER NEEDS TO BE PURGED FOR INACTIVTY!
USERNAME: ${data.username}
USERID: ${data.userId}
PLAYTIME: ${data.playtime}
PDCountBefore: ${data.pdCountBefore}
PDCount: ${data.pdCount}`
);
}
}

```
activity = {};

res.send("Activity checked and reset.");
```

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
console.log(`Running on port ${PORT}`);
});
