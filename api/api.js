const { init } = require("@heyputer/puter.js/src/init.cjs");

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    try {
        const token = process.env.puterAuthToken;

        if (!token) {
            return res.status(500).json({
                response: "error",
                error: "Puter token missing"
            });
        }

        const puter = init(token);

        const model =
            req.query.model ||
            req.body?.model ||
            "gpt-5.6-luna";

        const request =
            Number(
                req.query.request ||
                req.body?.request ||
                150
            );

        const question =
            req.query.question ||
            req.body?.question ||
            "";

        if (!question) {
            return res.status(400).json({
                response: "error",
                error: "question is required"
            });
        }

        if (request < 1 || request > 150) {
            return res.status(400).json({
                response: "error",
                error: "request must be between 1 and 150"
            });
        }

        const result = await puter.ai.chat(question, {
            model
        });

        let answer = "";

        if (typeof result === "string") {
            answer = result;
        } else if (result?.message?.content) {
            answer = result.message.content;
        } else if (result?.content) {
            answer = result.content;
        } else {
            answer = JSON.stringify(result);
        }

        return res.status(200).json({
            response: "success",
            model,
            request,
            question,
            answer
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            response: "error",
            error: error.message || "AI request failed"
        });
    }
};
