import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.code}>404</h1>
        <p style={styles.text}>Page not found</p>

        <button style={styles.button} onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  card: {
    textAlign: "center",
    maxWidth: "400px",
    width: "100%",
  },
  code: {
    fontSize: "clamp(4rem, 10vw, 6rem)",
    margin: 0,
  },
  text: {
    fontSize: "1.1rem",
    marginBottom: "1.5rem",
  },
  button: {
    padding: "0.75rem 1.25rem",
    fontSize: "1rem",
    cursor: "pointer",
  },
};