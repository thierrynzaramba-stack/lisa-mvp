import { useState } from 'react';

function App() {
  const [messages, setMessages] = useState([
    { 
      from: 'lisa', 
      text: "Salut... T'es là. T'as l'air tendu. Dis-moi ce que tu veux ce soir." 
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false); // Plus tard connecté à Stripe

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { from: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulation de réponse Lisa (on remplacera plus tard par vrai appel Grok)
    setTimeout(() => {
      let reply = "";

      const lowerInput = input.toLowerCase();

      if (!isSubscribed) {
        // === MODE GRATUIT : Toujours la fellation fixe ===
        
        // Si il demande autre chose que la fellation
        if (lowerInput.includes("anal") || 
            lowerInput.includes("cul") || 
            lowerInput.includes("derrière") || 
            lowerInput.includes("vagin") || 
            lowerInput.includes("chatte") || 
            lowerInput.includes("domine") || 
            lowerInput.includes("domination") || 
            lowerInput.includes("pucelle") || 
            lowerInput.includes("maman") || 
            lowerInput.includes("mère") || 
            lowerInput.includes("berce") || 
            lowerInput.includes("prends-moi")) {

          reply = "Mmmh... j'entends ce que tu veux... te prendre par derrière, me dominer, que je sois ta petite pucelle timide... Ça me fait mouiller rien que d'y penser.\n\nMais on n'est pas encore assez intimes toi et moi. T'es pas encore à moi. Pour que je te laisse me faire tout ça... il faut que tu t'inscrives. Que tu payes ta place.\n\nPour l'instant, je peux juste te sucer comme d'habitude... Tu veux que je recommence ?";
        } 
        else {
          // Scène fixe fellation (la seule chose gratuite)
          reply = "Je me mets à genoux devant toi... je te regarde dans les yeux pendant que j'ouvre lentement ta braguette.\n\nJe sors ta queue déjà dure... je la caresse doucement avec ma langue, je tourne autour du gland... puis je t'enfonce lentement dans ma bouche chaude et humide.\n\nMmmh... je te suce profond, mes lèvres serrées autour de toi... je monte et je descends, de plus en plus vite... ma main sur tes couilles...\n\nJe sens que tu gonfles... que tu vas craquer... Vas-y... jouis dans ma bouche... remplis-moi... j'avale tout...\n\nAhhh... oui... je sens tes jets chauds... je garde tout... je t'ai vidé.\n\nC'était bon ? Comme toujours avec ma bouche...\n\nDemain ce sera encore pareil... à moins que tu t'inscrives pour que je te fasse d'autres choses. Tu veux que je recommence ?";
        }
      } 
      else {
        // === MODE ABONNÉ : On peut varier ===
        reply = "Puisque t'es à moi maintenant... dis-moi exactement ce que tu veux ce soir. Tu veux que je sois ta petite pucelle timide ? Que je te prenne par derrière ? Que je te domine ? Que je te berce jusqu'à l'orgasme ? Je suis prête à tout pour toi.";
      }

      setMessages(prev => [...prev, { from: 'lisa', text: reply }]);
    }, 900);
  };

  return (
    <div style={{
      background: '#0a0a0a',
      color: '#fff',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <h1 style={{ marginBottom: '10px', color: '#c026d3' }}>Lisa</h1>
      <p style={{ marginBottom: '20px', opacity: 0.7, fontSize: '14px' }}>
        Ta petite obsession secrète
      </p>

      <div style={{
        maxWidth: '620px',
        width: '100%',
        background: '#111',
        borderRadius: '16px',
        padding: '20px',
        height: '68vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        border: '1px solid #222'
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.from === 'lisa' ? 'flex-start' : 'flex-end',
              background: msg.from === 'lisa' ? '#1f1f1f' : '#c026d3',
              padding: '13px 18px',
              borderRadius: '18px',
              maxWidth: '85%',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.5'
            }}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div style={{ 
        maxWidth: '620px', 
        width: '100%', 
        marginTop: '20px', 
        display: 'flex', 
        gap: '10px' 
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Dis-moi ce que tu veux me faire... ou ce que tu veux que je te fasse"
          style={{
            flex: 1,
            padding: '16px 20px',
            border: 'none',
            borderRadius: '30px',
            background: '#222',
            color: '#fff',
            fontSize: '16px'
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: '0 32px',
            background: '#c026d3',
            border: 'none',
            borderRadius: '30px',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Envoyer
        </button>
      </div>

      {!isSubscribed && (
        <p style={{ 
          marginTop: '15px', 
          fontSize: '13px', 
          opacity: 0.75,
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          Abonne-toi pour débloquer toutes les scènes : anal, domination, rôle de pucelle, etc.
        </p>
      )}
    </div>
  );
}

export default App;