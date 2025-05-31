const express = require("express");
const router = express.Router();
const middleware = require("../middleware/index.js");
const User = require("../models/user.js");
const Donation = require("../models/donation.js");

router.get("/agent/dashboard", middleware.ensureAgentLoggedIn, async (req,res) => {
    try {
        const agentId = req.user._id;

        // Recuperar las donaciones ASIGNADAS para este agente
        // Incluye las donaciones con estado "assigned"
        // y también las "collected" si quieres mostrarlas en la misma tabla o una sección separada
        const assignedCollections = await Donation.find({ agent: agentId, status: "assigned" })
                                                .populate("donor") // Para obtener la información del donante
                                                .sort({ collectionTime: 1 }); // O el campo que uses para ordenar, ej. por fecha de asignación

        // Opcional: Si quieres mostrar también las donaciones recolectadas en el dashboard principal
        // const collectedCollections = await Donation.find({ agent: agentId, status: "collected" })
        //                                         .populate("donor");

        // Los contadores que ya tenías
        const numAssignedDonations = await Donation.countDocuments({ agent: agentId, status: "assigned" });
        const numCollectedDonations = await Donation.countDocuments({ agent: agentId, status: "collected" });

        res.render("agent/dashboard", {
            title: "Dashboard del Agente",
            numAssignedDonations,
            numCollectedDonations,
            assignedCollections: assignedCollections // Pasa las donaciones asignadas a la vista
            // collectedCollections: collectedCollections // Opcional, si las necesitas en la misma vista
        });
    } catch (err) {
        console.error(err); // Usar console.error
        req.flash("error", "Ocurrió un error al cargar el dashboard del agente.");
        res.redirect("back");
    }
});

router.get("/agent/collections/pending", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const pendingCollections = await Donation.find({ agent: req.user._id, status: "assigned" }).populate("donor");
		res.render("agent/pendingCollections", { title: "Pending Collections", pendingCollections });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/agent/collections/previous", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const previousCollections = await Donation.find({ agent: req.user._id, status: "collected" }).populate("donor");
		res.render("agent/previousCollections", { title: "Previous Collections", previousCollections });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/agent/collection/view/:collectionId", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const collectionId = req.params.collectionId;
		const collection = await Donation.findById(collectionId).populate("donor");
		res.render("agent/collection", { title: "Collection details", collection });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/agent/collection/collect/:collectionId", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const collectionId = req.params.collectionId;
		await Donation.findByIdAndUpdate(collectionId, { status: "collected", collectionTime: Date.now() });
		req.flash("success", "Donation collected successfully");
		res.redirect(`/agent/collection/view/${collectionId}`);
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});



router.get("/agent/profile", middleware.ensureAgentLoggedIn, (req,res) => {
	res.render("agent/profile", { title: "My Profile" });
});

router.put("/agent/profile", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const id = req.user._id;
		const updateObj = req.body.agent;	// updateObj: {firstName, lastName, gender, address, phone}
		await User.findByIdAndUpdate(id, updateObj);
		
		req.flash("success", "Profile updated successfully");
		res.redirect("/agent/profile");
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
	
});


module.exports = router;