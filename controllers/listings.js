const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({accessToken: mapToken});

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    const validListings = allListings.filter(listing => listing.price !== undefined && listing.price !== null);
    res.render("listings/index.ejs", { allListings: validListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
    .populate({ path: "reviews",
         populate: {
            path: "author",
        },
    })
    .populate("owner");
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    } 
    res.render("listings/show.ejs", { listing });
};

// module.exports.createListing = async (req, res) => {
//     const listingData = req.body.listing;

//     // ADD this block to assign uploaded file
//     if (req.file) {
//         listingData.image = {
//             url: req.file.path,
//             filename: req.file.filename
//         };
//     }

//     const newListing = new Listing(listingData); // ✅ Declare with const
//     newListing.owner = req.user._id;
//     await newListing.save();

//     req.flash("success", "New listing created!");
//     res.redirect(`/listings/${newListing._id}`);
// };
module.exports.createListing = async (req, res, next) => {

let response = await geocodingClient
.forwardGeocode({
  query: req.body.listing.location,
  limit: 2,
})
  .send();

    let url = req.file.path;
    let filename = req.file.filename;
     const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url, filename};
    newListing.geometry = response.body.features[0].geometry;
    let savedListing = await newListing.save();
    console.log(savedListing);
     req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};


module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    } 
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// module.exports.updateListing = async (req, res) => {
//         const { id } = req.params;
//         const updatedData = req.body.listing;

//         // Fetch the listing to check ownership
//         const listing = await Listing.findById(id);
//         if (!listing.owner.equals(req.user._id)) {
//             req.flash("error", "You don't have permission to edit!");
//             return res.redirect(`/listings/${id}`);
//         }

//         // Assign default filename if missing
//         if (!updatedData.image.filename) {
//             updatedData.image.filename = `img_${Date.now()}`;
//         }

//         // Update the listing
//         await Listing.findByIdAndUpdate(id, updatedData);
//         req.flash("success", "Listing Updated!");
//         res.redirect(`/listings/${id}`);
//     };
module.exports.updateListing = async (req, res) => {
        let { id } = req.params;
        
        let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});

        if(typeof req.file !== "undefined") {
            let url = req.file.path;
            let filename = req.file.filename;
            listing.image = {url, filename};
            await listing.save();
        }
        req.flash("success", "Listing Updated!");
        res.redirect(`/listings/${id}`);
    };

    module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};

