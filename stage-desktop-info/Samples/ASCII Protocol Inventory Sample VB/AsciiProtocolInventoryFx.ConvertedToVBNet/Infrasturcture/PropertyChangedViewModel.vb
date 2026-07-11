'-----------------------------------------------------------------------
' <copyright file="PropertyChangedViewModel.cs" company="Technology Solutions UK Ltd"> 
'     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
' </copyright> 
' <author>Robin Stone</author>
'-----------------------------------------------------------------------
Imports System.Collections.Generic
Imports System.ComponentModel
Imports System.Linq
Imports System.Text

''' <summary>
''' Base class for view models that are going to use property changed notifications
''' </summary>
Public MustInherit Class PropertyChangedViewModel
	Implements INotifyPropertyChanged
	''' <summary>
	''' Raised when the value of a property changes
	''' </summary>
    Public Event PropertyChanged As PropertyChangedEventHandler Implements INotifyPropertyChanged.PropertyChanged

	''' <summary>
	''' Raises the <see cref="PropertyChanged"/> event
	''' </summary>
	''' <param name="propertyName">The name of the property where the value changed</param>
	Protected Overridable Sub OnPropertyChanged(propertyName As String)		
        RaiseEvent PropertyChanged(Me, New PropertyChangedEventArgs(propertyName))
    End Sub
End Class
