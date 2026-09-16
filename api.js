const { init } = require("@heyputer/puter.js/src/init.cjs");

module.exports = async function handler(req, res) {

    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );

    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    try {

        /*
         * Puter authentication token
         *
         * Vercel Dashboard:
         * Settings → Environment Variables
         *
         * Name:
         * puterAuthToken
         */
        const token = process.env.puterAuthToken;

        if (!token) {
            return res.status(500).json({
                response: "error",
                error: "puterAuthToken is not configured"
            });
        }

        const puter = init(token);

        // -----------------------------
        // GET parameters
        // -----------------------------

        let model = req.query.model || "gpt-5.6-luna";
        let requestLimit = Number(req.query.request || 150);
        let question = req.query.question || "";

        // -----------------------------
        // POST support
        // -----------------------------

        if (req.method === "POST") {

            let body = req.body || {};

            model = body.model || model;
            requestLimit = Number(
                body.request || requestLimit
            );
            question = body.question || question;
        }

        // -----------------------------
        // Decode values
        // -----------------------------

        try {
            model = decodeURIComponent(model);
        } catch {}

        try {
            question = decodeURIComponent(question);
        } catch {}

        // -----------------------------
        // Validation
        // -----------------------------

        if (!question) {
            return res.status(400).json({
                response: "error",
                error: "question is required"
            });
        }

        if (
            !Number.isInteger(requestLimit) ||
            requestLimit < 1
        ) {
            return res.status(400).json({
                response: "error",
                error: "request must be a positive number"
            });
        }

        // Maximum allowed value
        if (requestLimit > 150) {
            return res.status(400).json({
                response: "error",
                error: "request cannot be greater than 150"
            });
        }

        // -----------------------------
        // AI request
        // -----------------------------

        const result = await puter.ai.chat(
            question,
            {
                model: model
            }
        );

        // -----------------------------
        // Extract answer
        // -----------------------------

        let answer;

        if (typeof result === "string") {

            answer = result;

        } else if (
            result &&
            result.message &&
            result.message.content
        ) {

            answer = result.message.content;

        } else if (
            result &&
            result.content
        ) {

            answer = result.content;

        } else {

            answer = JSON.stringify(result);
        }

        // -----------------------------
        // Response
        // -----------------------------

        return res.status(200).json({
            response: "success",
            model: model,
            request: requestLimit,
            question: question,
            answer: answer
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            response: "error",
            error: error.message || "AI request failed"
        });
    }
};
