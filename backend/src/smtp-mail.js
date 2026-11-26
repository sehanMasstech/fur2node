const net = require("node:net");
const tls = require("node:tls");

class SmtpChannel {
  constructor(socket) {
    this.socket = socket;
    this.buffer = "";
    this.waiters = [];
    this.onData = (chunk) => { this.buffer += chunk.toString("utf8"); this.flush(); };
    socket.on("data", this.onData);
    socket.setTimeout(20000, () => socket.destroy(new Error("SMTP server timed out.")));
  }
  flush() {
    if (!this.waiters.length) return;
    const lines = this.buffer.split(/\r?\n/);
    const finalLine = lines.findIndex((line) => /^\d{3} /.test(line));
    if (finalLine < 0) return;
    const response = lines.slice(0, finalLine + 1).join("\r\n");
    this.buffer = this.buffer.slice(response.length).replace(/^\r?\n/, "");
    this.waiters.shift()(response);
    if (this.waiters.length) this.flush();
  }
  response() { return new Promise((resolve) => { this.waiters.push(resolve); this.flush(); }); }
  async command(command, expected) {
    const pending = this.response();
    this.socket.write(`${command}\r\n`);
    const response = await pending;
    const code = Number(response.slice(0, 3));
    if (!expected.includes(code)) throw new Error(`SMTP rejected a command (${code}).`);
    return response;
  }
  async startTls(host) {
    this.socket.removeListener("data", this.onData);
    this.buffer = "";
    const secureSocket = tls.connect({ socket: this.socket, servername: host });
    await new Promise((resolve, reject) => {
      secureSocket.once("secureConnect", resolve);
      secureSocket.once("error", reject);
    });
    this.socket = secureSocket;
    this.socket.on("data", this.onData);
    this.socket.setTimeout(20000, () => secureSocket.destroy(new Error("SMTP server timed out.")));
  }
  close() { this.socket.end(); }
}

function validateMailSettings(settings, password) {
  const mail = settings?.smtp || {};
  if (!mail.enabled || !mail.host || !mail.port || !mail.user || !password || !mail.fromEmail) {
    throw new Error("Complete and enable SMTP host, port, login, password, and sender email first.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.fromEmail)) throw new Error("Enter a valid SMTP sender email address.");
  return mail;
}

async function sendSmtpMail(settings, password, message) {
  const mail = validateMailSettings(settings, password);
  const socket = mail.secure
    ? tls.connect({ host: mail.host, port: mail.port, servername: mail.host })
    : net.connect({ host: mail.host, port: mail.port });
  const channel = new SmtpChannel(socket);
  try {
    if (mail.secure) await new Promise((resolve, reject) => { socket.once("secureConnect", resolve); socket.once("error", reject); });
    else await new Promise((resolve, reject) => { socket.once("connect", resolve); socket.once("error", reject); });
    let greeting = await channel.response();
    if (!greeting.startsWith("220")) throw new Error("SMTP server did not accept the connection.");
    let hello = await channel.command(`EHLO ${mail.host}`, [250]);
    if (!mail.secure) {
      if (!hello.toUpperCase().includes("STARTTLS")) throw new Error("SMTP server does not offer STARTTLS. Use a secure TLS port instead.");
      await channel.command("STARTTLS", [220]);
      await channel.startTls(mail.host);
      await channel.command(`EHLO ${mail.host}`, [250]);
    }
    await channel.command("AUTH LOGIN", [334]);
    await channel.command(Buffer.from(mail.user).toString("base64"), [334]);
    await channel.command(Buffer.from(password).toString("base64"), [235]);
    await channel.command(`MAIL FROM:<${mail.fromEmail}>`, [250]);
    await channel.command(`RCPT TO:<${message.to}>`, [250, 251]);
    await channel.command("DATA", [354]);
    const boundary = `home-shape-${Date.now().toString(36)}`;
    const safeSubject = Buffer.from(message.subject).toString("base64");
    const body = [
      `From: =?UTF-8?B?${Buffer.from(mail.fromName || "Home Shape").toString("base64")}?= <${mail.fromEmail}>`,
      `To: <${message.to}>`, `Subject: =?UTF-8?B?${safeSubject}?=`, "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${boundary}"`, "",
      `--${boundary}`, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "",
      Buffer.from(message.text, "utf8").toString("base64").replace(/.{1,76}/g, "$&\r\n").trim(),
      `--${boundary}`, "Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64", "",
      Buffer.from(message.html, "utf8").toString("base64").replace(/.{1,76}/g, "$&\r\n").trim(),
      `--${boundary}--`, ""
    ].join("\r\n").replace(/(^|\r\n)\./g, "$1..");
    const accepted = channel.response();
    socket.write(`${body}\r\n.\r\n`);
    const result = await accepted;
    if (!result.startsWith("250")) throw new Error("SMTP server did not accept the message.");
    await channel.command("QUIT", [221]);
  } finally {
    channel.close();
  }
}

module.exports = { sendSmtpMail, validateMailSettings };
