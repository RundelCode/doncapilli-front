'use client';
import Navbar from "../../components/Navbar/navbar";
import styles from "./page.module.css";

export default function Home() {

  return (
    <div className={styles.page}>
      <Navbar></Navbar>
      <div className={styles.card}>
        Hola
      </div>
    </div>
  );
}
