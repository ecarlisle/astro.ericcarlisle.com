type Props = {
	tags: string[]
}

const Tags = ({tags}:Props):JSX.Element => {

  return (
		<div className="tags">
			{ tags.map((tag, index, tags) => (
				index === tags.length -1 ?
					`#${tag}` : `#${tag}, `
			))}
		</div>
  );
};

export default Tags;
