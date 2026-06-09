import { useState, useEffect } from 'react';
import { Scale, Flame, Target, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import userService from '../services/user.service';

const goals = [
  { value: '', label: 'Maintain weight' },
  { value: 'weight_loss', label: 'Lose weight' },
  { value: 'weight_gain', label: 'Gain weight' },
  { value: 'muscle_gain', label: 'Build muscle' },
];
const activities = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Lightly active' },
  { value: 'moderate', label: 'Moderately active' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very active' },
];
const categoryColor = (cat) => ({
  underweight: '#3b82f6', normal: '#22c55e', overweight: '#f59e0b', obese: '#ef4444',
}[cat] || '#1ABC9C');

export function BMI() {
  const { c, isDark } = useTheme();
  const onCardPrimary   = isDark ? c.textPrimary   : c.textOnCardPrimary;
  const onCardSecondary = isDark ? c.textSecondary : c.textOnCardSecondary;

  const [form, setForm] = useState({
    height_cm: '', weight_kg: '', age: '', gender: 'male', healthGoal: '', activityLevel: 'moderate',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    userService.getBmi().then((b) => {
      if (b?.value) {
        setResult(b);
        setForm((f) => ({
          ...f,
          height_cm: b.height_cm || '', weight_kg: b.weight_kg || '',
          age: b.age || '', gender: b.gender || 'male', healthGoal: b.healthGoal || '',
        }));
      }
    }).catch(() => {});
  }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.height_cm || !form.weight_kg) { setErr('Please enter height and weight.'); return; }
    setLoading(true); setErr(null);
    try {
      const data = await userService.saveBmi({
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
        age: Number(form.age) || undefined,
        gender: form.gender,
        healthGoal: form.healthGoal || undefined,
        activityLevel: form.activityLevel,
      });
      setResult(data.bmi);
    } catch (e2) {
      setErr(e2.message || 'Could not calculate BMI.');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = { background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow };
  const inputStyle = { background: c.inputBg, border: `1px solid ${c.inputBorder}`, color: c.inputText || '#fff' };
  const labelCls = 'block text-xs font-medium mb-2';

  const bmiVal = result?.value || 0;
  const gaugePct = Math.min(100, Math.round((bmiVal / 40) * 100));
  const gaugeData = [{ name: 'BMI', value: gaugePct, fill: categoryColor(result?.category) }];
  const macros = result?.macros || {};

  const field = (label, name, type = 'number', extra = {}) => (
    <div>
      <label className={labelCls} style={{ color: onCardPrimary }}>{label}</label>
      <input
        name={name} type={type} value={form[name]} onChange={onChange}
        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
        style={inputStyle} {...extra}
      />
    </div>
  );

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.tagBg }}>
              <Scale className="w-5 h-5" style={{ color: c.teal }} />
            </div>
            <h1 className="text-3xl font-bold" style={{ color: c.textPrimary, fontFamily: 'Poppins, sans-serif' }}>BMI Calculator</h1>
          </div>
          <p style={{ color: c.textSecondary }} className="text-sm">
            Calculate your BMI and get AI-personalized calorie and macro targets.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-6" style={cardStyle}>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {field('Height (cm)', 'height_cm', 'number', { placeholder: '170', min: 50, max: 300 })}
                {field('Weight (kg)', 'weight_kg', 'number', { placeholder: '70', min: 10, max: 500 })}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {field('Age', 'age', 'number', { placeholder: '30', min: 1, max: 120 })}
                <div>
                  <label className={labelCls} style={{ color: onCardPrimary }}>Gender</label>
                  <select name="gender" value={form.gender} onChange={onChange} className="w-full px-4 py-2.5 rounded-lg text-sm outline-none" style={inputStyle}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls} style={{ color: onCardPrimary }}>Health Goal</label>
                <select name="healthGoal" value={form.healthGoal} onChange={onChange} className="w-full px-4 py-2.5 rounded-lg text-sm outline-none" style={inputStyle}>
                  {goals.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ color: onCardPrimary }}>Activity Level</label>
                <select name="activityLevel" value={form.activityLevel} onChange={onChange} className="w-full px-4 py-2.5 rounded-lg text-sm outline-none" style={inputStyle}>
                  {activities.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              {err && <p className="text-xs" style={{ color: '#ef4444' }}>{err}</p>}
              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-70" style={{ background: 'linear-gradient(135deg,#1ABC9C,#0e9c80)' }}>
                {loading ? 'Calculating…' : 'Calculate BMI'}
              </button>
            </form>
          </motion.div>

          {/* Result */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl p-6" style={cardStyle}>
            {!result ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10" style={{ color: onCardSecondary }}>
                <Scale className="w-10 h-10 mb-3" style={{ color: c.teal, opacity: 0.7 }} />
                <p className="text-sm">Enter your details to see your BMI and personalized targets.</p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={160}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" barSize={14} data={gaugeData} startAngle={180} endAngle={-180}>
                      <RadialBar background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="text-center -mt-24 mb-12">
                    <div className="text-4xl font-bold" style={{ color: onCardPrimary }}>{bmiVal}</div>
                    <div className="text-xs capitalize mt-1" style={{ color: categoryColor(result.category) }}>{result.category}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl p-3" style={{ background: c.inputBg, border: `1px solid ${c.inputBorder}` }}>
                    <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: onCardSecondary }}><Flame className="w-3.5 h-3.5" /> Daily Calories</div>
                    <div className="text-lg font-bold" style={{ color: onCardPrimary }}>{result.dailyCalories || '—'} <span className="text-xs font-normal">kcal</span></div>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: c.inputBg, border: `1px solid ${c.inputBorder}` }}>
                    <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: onCardSecondary }}><Target className="w-3.5 h-3.5" /> Macro Split</div>
                    <div className="text-xs font-medium" style={{ color: onCardPrimary }}>
                      P {Math.round(macros.protein || 0)}% · C {Math.round(macros.carbs || 0)}% · F {Math.round(macros.fat || 0)}%
                    </div>
                  </div>
                </div>

                {result.tips?.length ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4" style={{ color: c.teal }} />
                      <span className="text-sm font-semibold" style={{ color: onCardPrimary }}>Personalized Tips</span>
                    </div>
                    <ul className="space-y-1.5">
                      {result.tips.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs" style={{ color: onCardSecondary }}>
                          <span style={{ color: c.teal }}>•</span> {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
