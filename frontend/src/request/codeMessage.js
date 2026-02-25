const codeMessage = {
200 : 'Le serveur a renvoyé avec succès les données demandées.',

201 : 'Les données ont été créées ou modifiées avec succès.',

202 : 'La demande a été mise en arrière-plan (tâche asynchrone).',

204 : 'Les données ont été supprimées avec succès.',

400 : 'Une erreur est survenue dans la demande envoyée, et le serveur n’a pas créé ni modifié les données.',

401 : 'L’administrateur n’a pas la permission, veuillez essayer de vous reconnecter.',

403 : 'L’administrateur est autorisé, mais l’accès est interdit.',

404 : 'La demande envoyée concerne un enregistrement qui n’existe pas, et le serveur n’est pas opérationnel.',

406 : 'Le format demandé n’est pas disponible.',

410 : 'La ressource demandée a été définitivement supprimée et ne sera plus disponible.',

422 : 'Une erreur de validation est survenue lors de la création d’un objet.',

500 : 'Une erreur est survenue sur le serveur, veuillez vérifier le serveur.',

502 : 'Erreur de passerelle.',

503 : 'Le service est indisponible, le serveur est temporairement surchargé ou en maintenance.',

504 : 'Le délai d’attente de la passerelle a expiré.',
};

export default codeMessage;
