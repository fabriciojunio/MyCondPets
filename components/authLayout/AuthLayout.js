import Image from "next/image";
import "./style.css";

const AuthLayout = ({ children, title }) => {
  return (
    <div className="auth-container">
      <section className="image-section">
        <Image
          src="/images/pet23.jpg"
          alt="Imagem de um pet"
          width={300}
          height={300}
          className="auth-image"
          priority
        />
      </section>
      <section className="form-section">
        <h1>{title}</h1>
        {children}
      </section>
    </div>
  );
};

export default AuthLayout;