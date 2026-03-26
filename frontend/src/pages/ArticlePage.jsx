import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ArticlePage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/article/${id}`);
        const data = await res.json();
        setArticle(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchArticle();
  }, [id]);

  if (!article) return <div>Loading...</div>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
      <img src={article.image} alt="" className="mb-4" />
      <p>{article.description}</p>

      <a 
        href={article.url} 
        target="_blank" 
        rel="noreferrer"
        className="text-blue-400 underline mt-4 inline-block"
      >
        Read full article
      </a>
    </div>
  );
}