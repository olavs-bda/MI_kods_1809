import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { generateShameMessage, getEscalationEmojis } from "./shame-messages.js";

const EscalationEmail = ({
  taskTitle = "Complete project proposal",
  ownerEmail = "user@example.com",
  ownerName = "John Doe",
  escalationLevel = 1,
  dueDate = "2024-01-15",
  contactName = "Sarah",
  customMessage = "",
  hoursOverdue = 60,
  relationship = "friend",
}) => {
  // Generate dynamic shame message content
  const shameContent = generateShameMessage({
    escalationLevel,
    taskTitle,
    ownerName,
    ownerEmail,
    contactName,
    dueDate,
    hoursOverdue,
    relationship,
    customMessage,
  });

  // Get escalation styling based on level
  const escalationStyles = {
    1: {
      emoji: "⏰",
      title: "Gentle Reminder",
      color: "#f59e0b",
      bgColor: "#fef3c7",
    },
    2: {
      emoji: "🚨",
      title: "Escalation Alert",
      color: "#f97316",
      bgColor: "#fed7aa",
    },
    3: {
      emoji: "💀",
      title: "MAXIMUM SHAME",
      color: "#dc2626",
      bgColor: "#fecaca",
    },
  };

  const escalation = escalationStyles[escalationLevel] || escalationStyles[1];
  const previewText = shameContent.subject;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={{ ...header, backgroundColor: escalation.bgColor }}>
            <Text style={{ ...headerText, color: escalation.color }}>
              {escalation.emoji} AccountaList Alert
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={{ ...h1, color: escalation.color }}>
              {escalation.title}
            </Heading>

            <Text style={text}>{shameContent.opening}</Text>

            <Text style={text}>
              This is a <strong>{shameContent.intensity}</strong> from
              AccountaList.
            </Text>

            <Section style={alertBox}>
              <Text
                style={{
                  ...alertText,
                  borderLeftColor: escalation.color,
                  whiteSpace: "pre-line",
                }}
              >
                {shameContent.shameMessage}
              </Text>
            </Section>

            {customMessage && (
              <Section style={messageBox}>
                <Text style={messageText}>
                  <strong>Personal message from {ownerName}:</strong>
                  <br />"{customMessage}"
                </Text>
              </Section>
            )}

            <Text style={text}>{shameContent.callToAction}</Text>

            {escalationLevel === 3 && (
              <Section style={maxShameBox}>
                <Text style={maxShameText}>
                  💀 MAXIMUM SHAME MODE ACTIVATED 💀
                </Text>
                <Text style={text}>
                  They agreed to these consequences when they set up their
                  accountability system. It's time to deliver the tough love
                  they asked for!
                </Text>
              </Section>
            )}

            <Section style={footer}>
              <Text style={footerText}>
                You're receiving this because {ownerName} added you as their
                accountability contact on AccountaList. This system works
                because of people like you who care about helping others
                succeed.
              </Text>
              <Text style={{ ...footerText, marginTop: "10px" }}>
                Want to help {ownerName} improve?{" "}
                <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}>
                  Visit AccountaList
                </Link>{" "}
                to learn more about social accountability.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default EscalationEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "20px 30px",
  textAlign: "center",
  borderRadius: "8px 8px 0 0",
};

const headerText = {
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
};

const content = {
  padding: "30px",
};

const h1 = {
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 20px 0",
  textAlign: "center",
};

const text = {
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "16px 0",
  color: "#374151",
};

const alertBox = {
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
};

const alertText = {
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "0",
  paddingLeft: "20px",
  borderLeft: "4px solid",
  color: "#374151",
};

const messageBox = {
  backgroundColor: "#e0f2fe",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
  borderLeft: "4px solid #0ea5e9",
};

const messageText = {
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "0",
  color: "#0c4a6e",
  fontStyle: "italic",
};

const footer = {
  marginTop: "32px",
  paddingTop: "20px",
  borderTop: "1px solid #e5e7eb",
};

const footerText = {
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "8px 0",
  color: "#6b7280",
};

const maxShameBox = {
  backgroundColor: "#dc2626",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
  textAlign: "center",
};

const maxShameText = {
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 10px 0",
  color: "#ffffff",
};
