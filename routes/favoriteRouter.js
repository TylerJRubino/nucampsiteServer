const express = require("express");
const authenticate = require("../authenticate");
const cors = require("./cors");
const Favorite = require("../models/favorite");
const favoriteRouter = express.Router();

favoriteRouter
	.route("/")
	.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
	.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
		Favorite.findOne({ user: req.user._id })
			.then((favorite) => {
				if (!favorite) {
					res.statusCode = 200;
					res.setHeader("Content-Type", "application/json");
					res.json({ exists: false });
				} else {
					Favorite.findById(favorite._id)
						.populate("campsites")
						.then((favorite) => {
							res.statusCode = 200;
							res.setHeader("Content-Type", "application/json");
							res.json({
								exists: true,
								campsites: favorite.campsites,
							});
						})
						.catch((err) => next(err));
				}
			})
			.catch((err) => next(err));
	})
	.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
		Favorite.findOne({ user: req.user._id })
			.then((favorite) => {
				if (favorite) {
					req.body.forEach((reqCampsite) => {
						if (!favorite.campsites.includes(reqCampsite._id)) {
							favorite.campsites.push(reqCampsite._id);
							favorite
								.save()
								.then((favorite) => {
									favorite
										.populate("campsites")
										.then((favorite) => {
											res.statusCode = 200;
											res.setHeader(
												"Content-Type",
												"application/json"
											);
											res.json(favorite);
										})
										.catch((err) => next(err));
								})
								.catch((err) => next(err));
						} else {
							err = new Error(
								`All Campsites are already in list of favorites!`
							);
							err.status = 404;
							return next(err);
						}
					});
				} else {
					new Favorite({ user: req.user._id, campsites: req.body })
						.save()
						.then((favorite) => {
							favorite
								.populate("campsites")
								.then((favorite) => {
									res.statusCode = 200;
									res.setHeader(
										"Content-Type",
										"application/json"
									);
									res.json(favorite);
								})
								.catch((err) => next(err));
						})
						.catch((err) => next(err));
				}
			})
			.catch((err) => next(err));
	})
	.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
		res.statusCode = 403;
		res.end(`PUT operation not supported on /favorites`);
	})
	.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
		Favorite.findOneAndDelete({ user: req.user._id })
			.then((favorite) => {
				res.statusCode = 200;
				if (favorite) {
					res.setHeader("Content-Type", "application/json");
					res.json(favorite);
				} else {
					res.setHeader("Content-Type", "text/plain");
					res.end("You do not have any favorites to delete.");
				}
			})
			.catch((err) => next(err));
	});

favoriteRouter
	.route("/:campsiteId")
	.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
	.get(cors.cors, authenticate.verifyUser, (req, res) => {
		res.statusCode = 403;
		res.end(
			`GET operation not supported on /favorites/${req.params.campsiteId}`
		);
	})
	.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
		Favorite.findOne({ user: req.user._id })
			.then((favorite) => {
				if (favorite) {
					if (favorite.campsites.includes(req.params.campsiteId)) {
						res.statusCode = 200;
						res.setHeader("Content-Type", "application/json");
						res.json({
							exists: true,
							campsites: favorite.campsites,
						});
					} else {
						favorite.campsites.push({ _id: req.params.campsiteId });
						favorite
							.save()
							.then((favorite) => {
								Favorite.findById(favorite._id)
									.populate("campsites")
									.then((favorite) => {
										res.statusCode = 200;
										res.setHeader(
											"Content-Type",
											"application/json"
										);
										res.json({
											exists: true,
											campsites: favorite.campsites,
										});
									})
									.catch((err) => next(err));
							})
							.catch((err) => next(err));
					}
				} else {
					Favorite.create({
						user: req.user._id,
						campsites: [req.params.campsiteId],
					})
						.then((favorite) => {
							Favorite.findById(favorite._id)
								.populate("campsites")
								.then((favorite) => {
									res.statusCode = 200;
									res.setHeader(
										"Content-Type",
										"application/json"
									);
									res.json({
										exists: true,
										campsites: favorite.campsites,
									});
								})
								.catch((err) => next(err));
						})
						.catch((err) => next(err));
				}
			})
			.catch((err) => next(err));
	})
	.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
		res.statusCode = 403;
		res.end(
			`PUT operation not supported on /favorites/${req.params.campsiteId}`
		);
	})
	.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
		Favorite.findOne({ user: req.user._id })
			.then((favorite) => {
				if (favorite) {
					favorite.campsites = favorite.campsites.filter((fav) => {
						return fav.toString() !== req.params.campsiteId;
					});
					if (favorite.campsites.length < 1) {
						Favorite.findByIdAndDelete(favorite._id)
							.then((favorite) => {
								res.statusCode = 200;
								res.setHeader(
									"Content-Type",
									"application/json"
								);
								res.json({ exists: false });
							})
							.catch((err) => next(err));
					} else {
						favorite
							.save()
							.then((favorite) => {
								Favorite.findById(favorite._id)
									.populate("campsites")
									.then((favorite) => {
										console.log(
											"Favorite Campsite Deleted!",
											favorite
										);
										res.statusCode = 200;
										res.setHeader(
											"Content-Type",
											"application/json"
										);
										res.json({
											exists: true,
											campsites: favorite.campsites,
										});
									})
									.catch((err) => next(err));
							})
							.catch((err) => next(err));
					}
				} else {
					res.statusCode = 200;
					res.setHeader("Content-Type", "application/json");
					res.json({ exists: false });
				}
			})
			.catch((err) => next(err));
	});

module.exports = favoriteRouter;