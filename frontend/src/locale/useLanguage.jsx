import fr from "./translation/fr.js"; // Import des traductions en français

const getLabel = (key) => {
  const lowerCaseKey = key.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");

  // Vérifie si la clé existe dans `fr.json`
  if (fr[lowerCaseKey]) {
    return fr[lowerCaseKey]; // Retourne la traduction en français
  }

  // Si la clé n'existe pas, formater proprement le texte par défaut
  return key
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const useLanguage = () => {
  return (value) => getLabel(value);
};

export default useLanguage;
