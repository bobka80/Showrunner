//-----------------------------------------------------------------------
// <copyright file="SelectParameters.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Entities
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Linq;
    using System.Text;

    using TechnologySolutions.Rfid.AsciiProtocol;
    using TechnologySolutions.Rfid.AsciiProtocol.Parameters;

    /// <summary>
    /// Extends the API interface to provide a view the list of available options
    /// </summary>
    public interface IObservableSelectParameters
        : INotifyPropertyChanged, ISelectParameters
    {
    }

    /// <summary>
    /// Container for the common select parameters
    /// </summary>
    public class SelectParameters
        : PropertyChangedEntityBase, IObservableSelectParameters
    {
        /// <summary>
        /// Backing field for SelectAction
        /// </summary>
        private SelectAction? selectAction;

        /// <summary>
        /// Backing field for SelectDatabank
        /// </summary>
        private Databank? selectDatabank;

        /// <summary>
        /// Backing field for SelectData
        /// </summary>
        private string selectData = string.Empty;

        /// <summary>
        /// Backing field for SelectLength
        /// </summary>
        private int? selectLength;

        /// <summary>
        /// Backing field for SelectOffset
        /// </summary>
        private int? selectOffset;

        /// <summary>
        /// Backing field for SelectTarget
        /// </summary>
        private SelectTarget? selectTarget;

        /// <summary>
        /// Backing field for InventoryOnly
        /// </summary>
        private TriState? inventoryOnly;        

        /// <summary>
        /// Gets or sets the select action which determines the action to perform on 
        /// transponders that match and not match the selection
        /// </summary>
        public SelectAction? SelectAction
        {
            get
            {
                return this.selectAction;
            }

            set
            {
                if (this.selectAction != value)
                {
                    this.selectAction = value;
                    this.OnPropertyChanged("SelectAction");
                }
            }
        }        

        /// <summary>
        /// Gets or sets the select databank used to identify the transponders that match the select
        /// </summary>
        public Databank? SelectBank
        {
            get
            {
                return this.selectDatabank;
            }

            set
            {
                if (this.selectDatabank != value)
                {
                    this.selectDatabank = value;
                    this.OnPropertyChanged("SelectDatabank");
                }
            }
        }

        /// <summary>
        /// Gets or sets the select data expected for transponders that match the select
        /// </summary>
        public string SelectData
        {
            get
            {
                return this.selectData;
            }

            set
            {
                if (this.selectData != value)
                {
                    this.selectData = value;
                    this.OnPropertyChanged("SelectData");
                }
            }
        }

        /// <summary>
        /// Gets or sets the select length in bits of the SelectData that will match the select
        /// </summary>
        public int? SelectLength
        {
            get
            {
                return this.selectLength;
            }

            set
            {
                if (this.selectLength != value)
                {
                    this.selectLength = value;
                    this.OnPropertyChanged("SelectLength");
                }
            }
        }

        /// <summary>
        /// Gets or sets the select offset into the memory bank of transponder that match the select
        /// </summary>
        public int? SelectOffset
        {
            get
            {
                return this.selectOffset;
            }

            set
            {
                if (this.selectOffset != value)
                {
                    this.selectOffset = value;
                    this.OnPropertyChanged("SelectOffset");
                }
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
                return this.selectTarget;
            }

            set
            {
                if (this.selectTarget != value)
                {
                    this.selectTarget = value;
                    this.OnPropertyChanged("SelectTarget");
                }
            }
        }

        /// <summary>
        /// Gets or sets a value indicating wheter a select is not performed (i.e. only the inventory is)
        /// </summary>
        public TriState? InventoryOnly
        {
            get
            {
                return this.inventoryOnly;
            }

            set
            {
                if (this.inventoryOnly != value)
                {
                    this.inventoryOnly = value;
                    this.OnPropertyChanged("InventoryOnly");
                }
            }
        }
    }
}
