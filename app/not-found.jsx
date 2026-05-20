import Link from "next/link";
import "./globals.css";

export default function NotFound(){
  return(
    <div className="container_404">
      <div className="content_404">
        <div className="number_404">404</div>
        <h1 className="title_404">Oops! Página não encontrada</h1>
        <p className="description_404">
          Parece que você se perdeu. A página que você está procurando não existe.
        </p>
        
        <Link href="/" className="btn_home">
          <span>← Voltar para Home</span>
        </Link>
      </div>
    </div>
  )
}