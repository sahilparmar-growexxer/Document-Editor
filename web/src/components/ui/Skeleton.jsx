export default function Skeleton({ className = '', style = {} }) {
  const classes = ['bn-skeleton', className].filter(Boolean).join(' ');
  return <div className={classes} style={style} aria-hidden="true" />;
}
