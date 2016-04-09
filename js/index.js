(function () {

	window.App = {
		Models: {},
		Views: {},
		Collections: {},
		Router: {},
		Config: {},
	};

	//Config
	window.Config = {
					url: 'http://pokeapi.co',
					limit: 12
				};

	//Helpers
	window.template = function(id) {
		return _.template( $('#' + id).html() );
	};

	/**
	 * Pokemon Models.
	 * @type App.Models.Pokemon
	 */
	App.Models.Pokemon = Backbone.Model.extend({
		defaults: {
			national_id: 0,
			pkdx_id: 0,
			name: 'Name',
			types: [],
			attack: 0,
			defense: 0,
			hp: 0,
			spAttack: 0,
			spdefense: 0,
			speed: 0,
			weight: 0,
			totalMoves: 0
		}
	});

	/**
	 * PokemonType Models.
	 * @type App.Models.PokemonType
	 */
	App.Models.PokemonType = Backbone.Model.extend({
		defaults: {
			id: 0,
			name: ''
		}
	});

	/**
	 * Pokemons Collection.
	 * @type App.Collections.Pokemons
	 */
	App.Collections.Pokemons = Backbone.Collection.extend({
		model: App.Models.Pokemon,
		url: Config.url+'/api/v1/pokemon/?limit='+Config.limit,

		send: function() {
			var self = this;
			$('.js-loader').show();

			$.ajax({
			  type: "GET",
			  url: self.url,
			  dataType: "json",
			  success: function(response) {
			  	if(response.meta.next != null) {
			        self.url = Config.url+response.meta.next;
			    }

				var pokemons = response.objects;

			  	for(var key in pokemons) {
		        		
	        		var newPokemon =  new App.Models.Pokemon;
	        		newPokemon.set({
	        				national_id: pokemons[key].national_id, 
	        				name: pokemons[key].name,
							pkdx_id: pokemons[key].pkdx_id,
							types: pokemons[key].types,
							attack: pokemons[key].attack,
							defense: pokemons[key].defense,
							hp: pokemons[key].hp,
							spAttack: pokemons[key].sp_atk,
							spdefense: pokemons[key].sp_def,
							speed: pokemons[key].speed,
							weight: pokemons[key].weight,
							totalMoves: pokemons[key].moves.length
	        		});

	        		self.add(newPokemon);
	        	}

	        	$('.js-loader').hide();
			  },
			  error: function() {
			  	alert('Api не отвечает. Попробуйте перегрузить страницу.');
			  	console.log('error');
			  }
			});

		},
		searchByType: function(type) {

			return _(this.filter(function(pokemon) {
				var types = pokemon.get('types');
				for(var key in types) {
					if(types[key].name == type) {
						return true;
					}
				}
			}));
		}
	});

	/**
	 * PokemonTypes Collection.
	 * @type App.Collections.PokemonTypes
	 */
	App.Collections.PokemonTypes = Backbone.Collection.extend({
		model: App.Models.PokemonType,
		url: Config.url+'/api/v1/type/?limit=20',

		parse: function (response) {

			var types = response.objects;

		  	for(var key in types) {
	        		
        		var newPokemonType =  new App.Models.PokemonType;
        		newPokemonType.set({
        				id: types[key].id, 
        				name: types[key].name
        		});

        		this.add(newPokemonType);
        	}
		},

		send: function() {

			return this.fetch({
				containerType: 'application/json',
				type: 'GET',
				cache: false,
				url: this.url,
				reset: true
			});
		},
	});

	/**
	 * Filter Views.
	 * @type App.Views.Filter
	 */
	App.Views.Filter = Backbone.View.extend({
		tagName: 'select',
		className: 'filter',
		template: template('filter'),

		initialize: function() {
			this.collection.on('reset', this.render, this);
			this.collection.send();
		},

		render: function() {
			this.$el.html( this.template({types:this.collection.toJSON()}) );
			return this;
		},

	});

	/**
	 * Filter Views.
	 * @type App.Views.Filter
	 */
	App.Views.Pokemon = Backbone.View.extend({
		tagName: 'li',
		template: template('pokemon'),
		className: 'pokemon col-3',

		render: function() {
			this.$el.html( this.template(this.model.toJSON()) );

			return this;
		},

		events: {
			'click': 'viewDetail'
		},
		viewDetail: function() {
			var pokemonDetailView = new App.Views.PokemonDetail({model: this.model});
			$('.js-pokemon_detail').html(pokemonDetailView.render().el);

			var heightList = $('.js-pokemons').outerHeight();
			var containerPosition = $('.container__body').offset().top;
			var positionElement = this.el.offsetTop - containerPosition;
			var heightDetail = $('.js-pokemon_detail').outerHeight();

			if((positionElement + heightDetail) > heightList) {
				var difference = heightDetail + positionElement - heightList;
				positionElement -= difference;
				console.log('dif='+difference);

			} 

			$('.js-pokemon_detail').css('margin-top', positionElement + 'px');
		}
	});

	/**
	 * Filter Pokemons.
	 * @type App.Views.Pokemons
	 */
	App.Views.Pokemons = Backbone.View.extend({
		tagName: 'ul',
		className: 'pokemons',

		initialize: function() {
			this.collection.on('add', this.addOne, this);
			this.collection.send();
		},

		searchByType: function(type) {
			this.$el.html('');

			if(type == 'all') {
				this.render();
			} else {
				var filterd = this.collection.searchByType(type);
				var self = this;

				filterd.each(function(item){
		           self.addOne(item);
		        });
		    }
		},

		loadMore: function() {
			$('.js-loader').show();
			this.$el.html('');
			$('.filter').val('all');
			this.render();
			this.collection.send();
		},

		render: function() {
			this.collection.each(this.addOne, this);

			return this;
		},

		addOne: function (pokemon) {
			var pokemonView = new App.Views.Pokemon({model: pokemon});
			this.$el.append(pokemonView.render().el);
		}
	});

	/**
	 * Filter PokemonDetail.
	 * @type App.Views.PokemonDetail
	 */
	App.Views.PokemonDetail = Backbone.View.extend({
		tagName: 'div',
		template: template('pokemon-detail'),
		className: 'pokemon pokemon_detail',

		render: function() {
			this.$el.html( this.template(this.model.toJSON()) );

			return this;
		},
		
	});


	// init filter types
	var types = new App.Collections.PokemonTypes;
	var typesView  = new App.Views.Filter({collection: types});
	$('.js-filter').append(typesView.render().el);

	// init pokemo list
	var pokemonCollection = new App.Collections.Pokemons;
	var pokemonsView = new App.Views.Pokemons({collection: pokemonCollection});
	$('.js-pokemons').append(pokemonsView.render().el);

	// load more pokemons
	$(document).on('click', '.js-load-more', function (e) {
		pokemonsView.loadMore();
	});

	// filter
	$(document).on('change', '.filter', function (e) {
		var type = $(this).val().toLowerCase();
		$('.js-pokemon_detail').html('');
		pokemonsView.searchByType(type);
	});

}());