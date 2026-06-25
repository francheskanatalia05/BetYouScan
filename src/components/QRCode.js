 export default function QRCode({ value, size = 128 }) {
  return (
    <div style={{ 
      width: size, 
      height: size, 
      background: 'white',
      border: '2px solid #990000',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '4px',
        width: '80%',
        height: '80%'
      }}>
        {[...Array(9)].map((_, i) => (
          <div key={i} style={{
            background: Math.random() > 0.5 ? '#000' : '#fff',
            width: '100%',
            height: '100%'
          }} />
        ))}
      </div>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        width: '30px',
        height: '30px',
        border: '3px solid #000',
        borderRight: 'none',
        borderBottom: 'none'
      }} />
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        width: '30px',
        height: '30px',
        border: '3px solid #000',
        borderLeft: 'none',
        borderBottom: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        width: '30px',
        height: '30px',
        border: '3px solid #000',
        borderRight: 'none',
        borderTop: 'none'
      }} />
      <div style={{
        fontSize: '8px',
        textAlign: 'center',
        marginTop: '5px',
        wordBreak: 'break-all',
        padding: '5px'
      }}>
        {value?.substring(0, 15)}...
      </div>
    </div>
  );
}
