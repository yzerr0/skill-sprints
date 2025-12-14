import Image from "next/image";

export default function Home() {
  return (
    <div>
      <h1>Welcome to Skill Sprints!</h1>
      <p>Your journey to mastering new skills starts here.</p>
      <Image
        src="/skillsprint-logo.png"
        alt="Skill Sprints Logo"
        width={200}
        height={200}
      />
    </div>
  );
}
