export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['CA du jour', 'Ventes', 'Stock critique', 'Créances'].map((label) => (
          <div key={label} className="kpi-card">
            <div className="skeleton h-8 w-24 mb-2" />
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 card">
        <p className="text-gray-500 text-sm">
          Graphiques et alertes — à implémenter (Étape 4)
        </p>
      </div>
    </div>
  );
}
