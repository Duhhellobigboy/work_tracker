export default function handler(req, res) {
  throw new Error("My first Sentry error!");
  res.status(200).json({ name: "John Doe" });
}
