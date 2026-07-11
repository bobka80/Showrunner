//-----------------------------------------------------------------------
// <copyright file="SelectParametersViewModel.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.ViewModels
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using Entities;
    using TechnologySolutions.ModelViewViewModel.ViewModels;
    using TechnologySolutions.Rfid.AsciiProtocol;

    /// <summary>
    /// View model to manipulate the <see cref="ISelectParameters"/>
    /// </summary>
    /// TODO: move collection properties to observable class then remove this class
    public class SelectParametersViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// The parameters being manipulated
        /// </summary>
        private IObservableSelectParameters parameters;

        /// <summary>
        /// Initializes a new instance of the SelectParametersViewModel class
        /// </summary>
        /// <param name="selectParameters">The parameters to manipulate</param>
        public SelectParametersViewModel(IObservableSelectParameters selectParameters)
        {
            if (selectParameters == null)
            {
                throw new ArgumentNullException("selectParameters");
            }

            this.parameters = selectParameters;
            selectParameters.PropertyChanged += this.Parameters_PropertyChanged;
        }

        /// <summary>
        /// Gets or sets a value indicating wheter a select is not performed (i.e. only the inventory is)
        /// </summary>
        public bool? InventoryOnly
        {
            get
            {
                return this.parameters.InventoryOnly.ToNullableBool();
            }

            set
            {
                this.parameters.InventoryOnly = value.ToNullableTriState();
            }
        }

        /// <summary>
        /// Gets or sets the select action which determines the action to perform on 
        /// transponders that match and not match the selection
        /// </summary>
        public SelectAction? SelectAction
        {
            get
            {
                return this.parameters.SelectAction;
            }

            set
            {
                this.parameters.SelectAction = value;
            }
        }

        /// <summary>
        /// Gets the available select actions
        /// </summary>
        public ICollection<SelectAction> SelectActions
        {
            get
            {
                return (SelectAction[])Enum.GetValues(typeof(SelectAction));
            }
        }

        /// <summary>
        /// Gets or sets the select databank used to identify the transponders that match the select
        /// </summary>
        public Databank? SelectBank
        {
            get
            {
                return this.parameters.SelectBank;
            }

            set
            {
                this.parameters.SelectBank = value;
            }
        }

        /// <summary>
        /// Gets or sets the select data expected for transponders that match the select
        /// </summary>
        public string SelectData
        {
            get
            {
                return this.parameters.SelectData;
            }

            set
            {
                this.parameters.SelectData = value;
            }
        }

        /// <summary>
        /// Gets the available select databanks
        /// </summary>
        public ICollection<Databank> SelectDatabanks
        {
            get
            {
                return (Databank[])Enum.GetValues(typeof(Databank));
            }
        }

        /// <summary>
        /// Gets or sets the select length in bits of the SelectData that will match the select
        /// </summary>
        public int? SelectLength
        {
            get
            {
                return this.parameters.SelectLength;
            }

            set
            {
                this.parameters.SelectLength = value;
            }
        }

        /// <summary>
        /// Gets or sets the select offset into the memory bank of transponder that match the select
        /// </summary>
        public int? SelectOffset
        {
            get
            {
                return this.parameters.SelectOffset;
            }

            set
            {
                this.parameters.SelectOffset = value;
            }
        }

        /// <summary>
        /// Gets or sets the target of the select. The flag that will be modified on all matching and non matching transponders
        /// as specified by the <see cref="SelectAction"/>
        /// </summary>
        public SelectTarget? SelectTarget
        {
            get
            {
                return this.parameters.SelectTarget;
            }

            set
            {
                this.parameters.SelectTarget = value;
            }
        }

        /// <summary>
        /// Gets the available select targets
        /// </summary>
        public ICollection<SelectTarget> SelectTargets
        {
            get
            {
                return (SelectTarget[])Enum.GetValues(typeof(SelectTarget));
            }
        }

        /// <summary>
        /// Pass on the property change from the entity to the view. Using this dispatches the call on the correct thread
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void Parameters_PropertyChanged(object sender, System.ComponentModel.PropertyChangedEventArgs e)
        {
            this.OnPropertyChanged(e.PropertyName);
        }
    }
}
