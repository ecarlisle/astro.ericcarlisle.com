type Images = {
  slug: string,
  alt: string
}[];


interface props {
	height: number;
	width: number;
	images: Images;
}

const ArticleImage = ({width, height, images}:props):JSX.Element => {
  return (
    <picture>
      <source type="image/avif" srcSet={`${images[0].slug}_${width}w.avif`} />
			<source type="image/webp" srcSet={`${images[0].slug}_${width}w.webp`} />
      <img src={`${images[0].slug}_${width}w.jpg`} width={width} height={height} alt={images[0].alt} />
    </picture>
  );
};
export default ArticleImage;
