import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { runSimulateur } from '../../api/client';
import type { AcquitInfo, SimulateurResponse } from '../../types';
import { Calculator } from 'lucide-react';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { useAuth } from '../../contexts/AuthContext';
import { Step1Acquits } from './Step1Acquits';
import { Step2Conteneurs } from './Step2Conteneurs';
import { Step3Result } from './Step3Result';

function StepBar({ step }: Readonly<{ step: 1 | 2 | 3 }>) {
  const steps = ['Choisir un acquit', 'Sélectionner les conteneurs', 'Facture simulée'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done   = n < step;
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 3 ? 1 : 'unset' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800,
                background: done ? '#16a34a' : active ? 'var(--primary)' : 'var(--gray-200)',
                color: done || active ? 'white' : 'var(--gray-500)',
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? 'var(--gray-900)' : done ? '#16a34a' : 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {n < 3 && (
              <div style={{ flex: 1, height: 2, margin: '0 12px', background: done ? '#16a34a' : 'var(--gray-200)', minWidth: 32 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SimulateurPage() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const params     = new URLSearchParams(location.search);
  const { isAdmin, clientCode: authClientCode, clientName: authClientName } = useAuth();
  const clientCode = params.get('clientCode') || authClientCode || '';
  const clientName = params.get('clientName') || authClientName || '';

  const [step, setStep]         = useState<1 | 2 | 3>(1);
  const [acquit, setAcquit]     = useState<AcquitInfo | null>(null);
  const [result, setResult]     = useState<SimulateurResponse | null>(null);
  const [simError, setSimError] = useState(false);

  if (!clientCode) {
    navigate(isAdmin ? '/admin' : '/');
    return null;
  }

  const handleSelectAcquit = (a: AcquitInfo) => {
    setAcquit(a);
    setResult(null);
    setSimError(false);
    setStep(2);
  };

  const handleSimuler = async (selected: string[], dateSortie: string) => {
    setSimError(false);
    try {
      const r = await runSimulateur(clientCode, dateSortie, acquit!.numeroAcquit, selected);
      setResult(r);
      setStep(3);
    } catch {
      setSimError(true);
    }
  };

  const handleModifier = () => {
    setStep(2);
    setResult(null);
    setSimError(false);
  };

  const handleBackToAcquits = () => {
    setStep(1);
    setAcquit(null);
    setResult(null);
    setSimError(false);
  };

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--oncf-orange-bg)', border: '1px solid var(--oncf-orange-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calculator size={19} color="var(--primary)" />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-900)' }}>Simulateur Import</h1>
          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{clientName || clientCode} — estimation magasinage conteneurs en stock</span>
        </div>
      </div>

      <StepBar step={step} />

      {simError && <ErrorBanner />}

      {step === 1 && (
        <Step1Acquits clientCode={clientCode} onSelect={handleSelectAcquit} />
      )}

      {step === 2 && acquit && (
        <Step2Conteneurs
          clientCode={clientCode}
          acquit={acquit}
          onBack={handleBackToAcquits}
          onSimuler={handleSimuler}
        />
      )}

      {step === 3 && result && acquit && (
        <Step3Result
          result={result}
          acquit={acquit}
          onModifier={handleModifier}
          onClose={handleBackToAcquits}
        />
      )}
    </div>
  );
}
